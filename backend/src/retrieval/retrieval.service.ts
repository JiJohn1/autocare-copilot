import { Injectable, OnModuleDestroy, OnModuleInit, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { ServiceLogService } from '../system/service-log.service';

export interface ChunkResult {
  id: string;
  source: string;
  title: string;
  content: string;
  score: number;
}

@Injectable()
export class RetrievalService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RetrievalService.name);
  private pool!: Pool;

  constructor(
    private readonly config: ConfigService,
    @Optional() private readonly serviceLog: ServiceLogService,
  ) {}

  onModuleInit() {
    this.pool = new Pool({
      host: this.config.get<string>('DB_HOST', 'localhost'),
      port: this.config.get<number>('DB_PORT', 5432),
      database: this.config.get<string>('DB_NAME', 'autocare'),
      user: this.config.get<string>('DB_USER', 'postgres'),
      password: this.config.get<string>('DB_PASSWORD', 'postgres'),
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  getPool(): Pool {
    return this.pool;
  }

  async search(embedding: number[], topK: number): Promise<ChunkResult[]> {
    const threshold = this.config.get<number>('RAG_SIMILARITY_THRESHOLD', 0.7);
    const vector = `[${embedding.join(',')}]`;

    const searchStart = Date.now();
    void this.serviceLog?.push('VECTOR_SEARCH', 'pgvector 코사인 유사도 검색 실행', { topK, threshold });

    const result = await this.pool.query<ChunkResult & { score: number }>(
      `SELECT id, source, title, content,
              1 - (embedding <=> $1::vector) AS score
       FROM document_chunks
       WHERE 1 - (embedding <=> $1::vector) >= $2
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      [vector, threshold, topK],
    );

    const rows = result.rows;
    const latencyMs = Date.now() - searchStart;
    const topScore = rows.length > 0 ? Math.round(rows[0].score * 1000) / 1000 : null;
    void this.serviceLog?.push(
      'RETRIEVAL_RESULT',
      `검색 완료 — ${rows.length}개 문서 반환`,
      { count: rows.length, topScore, latencyMs },
    );

    return rows;
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
