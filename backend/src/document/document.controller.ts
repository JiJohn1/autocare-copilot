import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { DocumentService } from './document.service';
import { IngestJobStore } from './ingest-job.store';
import { IngestJob } from './dto/ingest-job.dto';
import { CreateDocumentDto } from './dto/create-document.dto';

@ApiTags('documents')
@Controller('documents')
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly jobStore: IngestJobStore,
  ) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: '문서 chunk 등록 및 임베딩 저장' })
  async create(@Body() dto: CreateDocumentDto) {
    return this.documentService.create(dto);
  }

  @Post('upload')
  @HttpCode(202)
  @ApiOperation({ summary: 'PDF / DOCX 파일 업로드 → 비동기 Job 처리 시작 → jobId 즉시 반환' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async upload(@Req() req: FastifyRequest) {
    if (!req.isMultipart()) {
      throw new BadRequestException('multipart/form-data 요청이 필요합니다.');
    }

    const data = await req.file();
    if (!data) {
      throw new BadRequestException('파일이 포함되지 않았습니다.');
    }

    const buffer = await data.toBuffer();
    const mimeType = data.mimetype;
    const originalName = data.filename;

    const jobId = randomUUID();
    const job: IngestJob = {
      jobId,
      status: 'processing',
      fileName: originalName,
      startedAt: new Date().toISOString(),
      progress: { windows: 0, windowsDone: 0, chunksTotal: 0, skipped: 0 },
    };
    this.jobStore.set(job);

    // 백그라운드 처리 (await 없이 실행)
    void this.documentService.ingestFile(buffer, originalName, mimeType, jobId);

    return job; // 즉시 반환
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: '업로드 Job 진행 상황 조회' })
  async getJob(@Param('jobId') jobId: string) {
    const job = this.jobStore.get(jobId);
    if (!job) throw new NotFoundException('Job을 찾을 수 없습니다.');
    return job;
  }

  @Get()
  @ApiOperation({ summary: '등록된 문서 chunk 목록 조회' })
  async findAll() {
    return this.documentService.findAll();
  }
}
