import { Injectable } from '@nestjs/common';
import { RetrievalService } from '../retrieval/retrieval.service';
import { LogStoreService, ErrorLog } from './log-store.service';

export interface WeeklyStat {
  date: string;   // 'YYYY-MM-DD'
  count: number;
}

@Injectable()
export class SystemService {
  constructor(
    private readonly logStore: LogStoreService,
    private readonly retrieval: RetrievalService,
  ) {}

  getLogs(): ErrorLog[] {
    return this.logStore.getAll();
  }

  async getWeeklyStats(): Promise<WeeklyStat[]> {
    const pool = this.retrieval.getPool();
    const result = await pool.query<WeeklyStat>(`
      WITH dates AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '6 days',
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date AS date
      )
      SELECT
        d.date::text AS date,
        COALESCE(COUNT(dc.id), 0)::int AS count
      FROM dates d
      LEFT JOIN document_chunks dc ON DATE(dc.created_at) = d.date
      GROUP BY d.date
      ORDER BY d.date
    `);
    return result.rows;
  }
}
