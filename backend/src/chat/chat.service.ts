import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { LlmService } from '../llm/llm.service';
import { RetrievalService } from '../retrieval/retrieval.service';
import { CacheService } from '../cache/cache.service';
import { ActivityLogService } from '../system/activity-log.service';
import { ServiceLogService } from '../system/service-log.service';
import { ChatQueryDto } from './dto/chat-query.dto';

export interface ChatResponse {
  answer: string;
  sources: Array<{
    title: string;
    source: string;
    content: string;
    score: number;
  }>;
  latency: number;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly llm: LlmService,
    private readonly retrieval: RetrievalService,
    private readonly cache: CacheService,
    private readonly config: ConfigService,
    @Optional() private readonly activityLog: ActivityLogService,
    @Optional() private readonly serviceLog: ServiceLogService,
  ) {}

  async query(dto: ChatQueryDto): Promise<ChatResponse> {
    const start = Date.now();
    const topK = dto.topK ?? this.config.get<number>('RAG_TOP_K', 3);
    const cacheKey = this.buildCacheKey(dto.question, topK);

    // 질문 수신
    this.activityLog?.push({
      type: 'QUERY',
      message: '질문 수신',
      detail: dto.question.slice(0, 50),
    });
    void this.serviceLog?.push('CHAT_QUERY', dto.question.slice(0, 80), { topK });

    // 캐시 확인
    const cacheStart = Date.now();
    const cached = await this.cache.get(cacheKey);
    const cacheDuration = Date.now() - cacheStart;

    if (cached) {
      this.activityLog?.push({
        type: 'CACHE_HIT',
        message: '캐시 HIT — 저장된 응답 반환',
        durationMs: cacheDuration,
      });
      void this.serviceLog?.push('CACHE_HIT', '캐시 응답 반환', { latencyMs: cacheDuration });
      const parsed = JSON.parse(cached) as ChatResponse;
      return { ...parsed, latency: Date.now() - start };
    }

    this.activityLog?.push({
      type: 'CACHE_MISS',
      message: '캐시 MISS — 새로 생성',
      durationMs: cacheDuration,
    });
    void this.serviceLog?.push('CACHE_MISS', '캐시 없음 — RAG 파이프라인 실행', { latencyMs: cacheDuration });

    // 임베딩
    const embedStart = Date.now();
    const embedding = await this.llm.embedText(dto.question);
    this.activityLog?.push({
      type: 'EMBED',
      message: '텍스트 임베딩 생성',
      detail: 'text-embedding-3-small',
      durationMs: Date.now() - embedStart,
    });

    // 벡터 검색
    const searchStart = Date.now();
    const chunks = await this.retrieval.search(embedding, topK);
    this.activityLog?.push({
      type: 'SEARCH',
      message: 'pgvector 유사도 검색',
      detail: `코사인 유사도 · ${chunks.length}개 문서 발견`,
      durationMs: Date.now() - searchStart,
    });

    // LLM 호출
    let answer: string;
    if (chunks.length > 0) {
      const llmStart = Date.now();
      void this.serviceLog?.push('LLM_CALL', 'OpenAI GPT-4o-mini 호출', { contextDocs: chunks.length, model: 'gpt-4o-mini' });
      answer = await this.llm.generateAnswer(dto.question, chunks.map((c) => c.content));
      const llmDuration = Date.now() - llmStart;
      this.activityLog?.push({
        type: 'LLM',
        message: 'GPT-4o-mini 답변 생성',
        detail: `문서 ${chunks.length}개 컨텍스트 사용`,
        durationMs: llmDuration,
      });
      void this.serviceLog?.push('LLM_RESPONSE', 'LLM 응답 수신 완료', { latencyMs: llmDuration, contextDocs: chunks.length });
    } else {
      answer = '관련 문서를 찾을 수 없습니다. 더 구체적인 질문을 해주세요.';
    }

    const response: ChatResponse = {
      answer,
      sources: chunks.map((c) => ({
        title: c.title,
        source: c.source,
        content: c.content,
        score: Math.round(c.score * 1000) / 1000,
      })),
      latency: Date.now() - start,
    };

    // 캐시 저장
    const ttl = this.config.get<number>('CACHE_TTL_SECONDS', 300);
    await this.cache.set(cacheKey, JSON.stringify(response), ttl);
    this.activityLog?.push({
      type: 'CACHE_SET',
      message: '응답 캐시 저장',
      detail: `TTL ${ttl}s`,
    });

    return response;
  }

  private buildCacheKey(question: string, topK: number): string {
    const hash = createHash('sha256')
      .update(`${question}:${topK}`)
      .digest('hex')
      .slice(0, 16);
    return `chat:${hash}`;
  }
}
