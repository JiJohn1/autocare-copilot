import { BadRequestException, Injectable, Logger, Optional } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { LlmService } from '../llm/llm.service';
import { RetrievalService } from '../retrieval/retrieval.service';
import { ActivityLogService } from '../system/activity-log.service';
import { ServiceLogService } from '../system/service-log.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { IngestJobStore } from './ingest-job.store';

export interface DocumentChunk {
  id: string;
  title: string;
  source: string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

/** GPT에 한 번에 넘길 최대 글자 수 (토큰 오버플로우 방지) */
const CHUNK_WINDOW = 10_000;
/** 한 윈도우에서 GPT가 생성할 최대 청크 수 */
const MAX_CHUNKS_PER_WINDOW = 10;

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    private readonly llm: LlmService,
    private readonly retrieval: RetrievalService,
    private readonly jobStore: IngestJobStore,
    @Optional() private readonly activityLog: ActivityLogService,
    @Optional() private readonly serviceLog: ServiceLogService,
  ) {}

  async create(dto: CreateDocumentDto): Promise<DocumentChunk> {
    // 임베딩 모델 한도(8191 토큰 ≈ 30,000자)를 넘지 않도록 내용 잘라내기
    const safeContent = dto.content.slice(0, 6000);

    const embedding = await this.llm.embedText(safeContent);
    const vector = `[${embedding.join(',')}]`;

    const pool = this.retrieval.getPool();
    const result = await pool.query<DocumentChunk>(
      `INSERT INTO document_chunks (source, title, content, embedding, metadata)
       VALUES ($1, $2, $3, $4::vector, $5)
       RETURNING id, title, source, content, metadata, created_at AS "createdAt"`,
      [dto.source, dto.title, safeContent, vector, JSON.stringify(dto.metadata ?? {})],
    );

    const chunk = result.rows[0];

    this.activityLog?.push({
      type: 'DOC_CREATED',
      message: '문서 Chunk 등록',
      detail: dto.title,
    });
    void this.serviceLog?.push('DOC_INGEST', `문서 청크 저장: ${dto.title}`, {
      source: dto.source,
      chunkId: chunk.id,
    });

    return chunk;
  }

  async ingestFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    jobId?: string,
  ): Promise<{ chunks: DocumentChunk[]; total: number; skipped: number }> {
    // ── 1. 파일 → 텍스트 추출 ──────────────────────────────────────────────
    let text: string;
    try {
      if (mimeType === 'application/pdf') {
        const result = await pdfParse(buffer);
        text = result.text ?? '';
      } else if (
        mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else {
        const msg = `지원하지 않는 파일 형식입니다. PDF 또는 DOCX만 가능합니다. (수신된 MIME: ${mimeType})`;
        if (jobId) {
          this.jobStore.update(jobId, { status: 'error', error: msg, finishedAt: new Date().toISOString() });
        }
        throw new BadRequestException(msg);
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error('파일 텍스트 추출 실패', err);
      const msg = '파일에서 텍스트를 추출하는 데 실패했습니다.';
      if (jobId) {
        this.jobStore.update(jobId, { status: 'error', error: msg, finishedAt: new Date().toISOString() });
      }
      throw new BadRequestException(msg);
    }

    if (text.trim().length < 100) {
      const msg = '문서에서 텍스트를 추출할 수 없습니다.';
      if (jobId) {
        this.jobStore.update(jobId, { status: 'error', error: msg, finishedAt: new Date().toISOString() });
      }
      throw new BadRequestException(msg);
    }

    void this.serviceLog?.push('FILE_PARSE', `${originalName} 텍스트 추출 완료`, {
      chars: text.length,
      mimeType,
    });

    this.logger.log(`[ingestFile] "${originalName}" 추출 완료 — ${text.length}자`);

    // ── 2. 대용량 문서: 윈도우 단위로 GPT 청킹 ───────────────────────────
    //   CHUNK_WINDOW(10,000자) 씩 잘라서 GPT에 순차 요청 → 결과 합산
    const windows = this.splitIntoWindows(text, CHUNK_WINDOW);
    this.logger.log(`[ingestFile] ${windows.length}개 윈도우로 분할하여 GPT 청킹 시작`);

    // 전체 윈도우 수 확정 후 job에 업데이트
    if (jobId) {
      this.jobStore.update(jobId, { progress: { windows: windows.length } });
    }

    const rawChunks: Array<{ title: string; content: string; metadata: Record<string, unknown> }> = [];
    for (let i = 0; i < windows.length; i++) {
      const win = windows[i];
      try {
        const winChunks = await this.llm.chunkDocument(win, originalName, {
          maxChunks: MAX_CHUNKS_PER_WINDOW,
          windowIndex: i,
          totalWindows: windows.length,
        });
        rawChunks.push(...winChunks);
        this.logger.log(`[ingestFile] 윈도우 ${i + 1}/${windows.length} → ${winChunks.length}개 청크`);
        if (jobId) {
          this.jobStore.update(jobId, { progress: { windowsDone: i + 1 } });
        }
      } catch (err) {
        this.logger.warn(`[ingestFile] 윈도우 ${i + 1} 청킹 실패`, err);
        if (jobId) {
          this.jobStore.update(jobId, { progress: { windowsDone: i + 1 } });
        }
      }
    }

    void this.serviceLog?.push(
      'CHUNK_PLAN',
      `GPT가 ${rawChunks.length}개 청크로 분할 계획 (${windows.length}개 윈도우)`,
      { chunkCount: rawChunks.length, windows: windows.length, fileName: originalName },
    );

    // ── 3. 각 청크 순차 저장 (rate limit 방지) ────────────────────────────
    const saved: DocumentChunk[] = [];
    let skipped = 0;
    for (const chunk of rawChunks) {
      try {
        const doc = await this.create({
          title: chunk.title,
          source: originalName,
          content: chunk.content,
          metadata: chunk.metadata,
        });
        saved.push(doc);
        if (jobId) {
          this.jobStore.update(jobId, { progress: { chunksTotal: saved.length, skipped } });
        }
      } catch (err) {
        this.logger.warn(`청크 저장 실패: "${chunk.title}"`, err);
        skipped++;
        if (jobId) {
          this.jobStore.update(jobId, { progress: { chunksTotal: saved.length, skipped } });
        }
      }
    }

    void this.serviceLog?.push(
      'FILE_INGEST_COMPLETE',
      `${originalName} 업로드 완료 (${saved.length}개 청크, 실패 ${skipped}개)`,
      { total: saved.length, skipped, fileName: originalName },
    );

    if (jobId) {
      this.jobStore.update(jobId, {
        status: 'done',
        finishedAt: new Date().toISOString(),
        progress: { chunksTotal: saved.length, skipped },
        result: { total: saved.length, skipped },
      });
    }

    return { chunks: saved, total: saved.length, skipped };
  }

  /** 텍스트를 windowSize 글자 단위로 분할 (단어/문장 경계 미흡하지만 단순·안정적) */
  private splitIntoWindows(text: string, windowSize: number): string[] {
    const windows: string[] = [];
    let offset = 0;
    while (offset < text.length) {
      windows.push(text.slice(offset, offset + windowSize));
      offset += windowSize;
    }
    return windows;
  }

  async findAll(): Promise<Omit<DocumentChunk, 'embedding'>[]> {
    const pool = this.retrieval.getPool();
    const result = await pool.query<DocumentChunk>(
      `SELECT id, title, source, content, metadata, created_at AS "createdAt"
       FROM document_chunks
       ORDER BY created_at DESC`,
    );
    return result.rows;
  }
}
