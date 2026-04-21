import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CacheService } from '../cache/cache.service';

export type ServiceEventType =
  | 'CHAT_QUERY'
  | 'VECTOR_SEARCH'
  | 'CACHE_HIT'
  | 'CACHE_MISS'
  | 'LLM_CALL'
  | 'LLM_RESPONSE'
  | 'DOC_INGEST'
  | 'RETRIEVAL_RESULT'
  | 'FILE_PARSE'
  | 'CHUNK_PLAN'
  | 'FILE_INGEST_COMPLETE';

export interface ServiceLog {
  id: string;
  time: string;       // ISO timestamp
  event: ServiceEventType;
  detail: string;
  meta?: Record<string, unknown>;
}

const REDIS_KEY = 'service:logs';
const MAX_LOGS = 50;

@Injectable()
export class ServiceLogService {
  private readonly logger = new Logger(ServiceLogService.name);

  constructor(private readonly cache: CacheService) {}

  async push(
    event: ServiceEventType,
    detail: string,
    meta?: Record<string, unknown>,
  ): Promise<void> {
    const log: ServiceLog = {
      id: randomUUID(),
      time: new Date().toISOString(),
      event,
      detail,
      ...(meta !== undefined ? { meta } : {}),
    };

    try {
      // CacheService wraps ioredis but only exposes get/set.
      // We need lpush + ltrim — access the raw client via a workaround.
      // CacheService.set() uses ioredis under the hood; we replicate with
      // a dedicated approach using the exposed get/set primitives + JSON list.
      await this.pushToRedisList(log);
    } catch (err) {
      // Log store failure must never crash the app.
      this.logger.debug(`ServiceLog push skipped: ${(err as Error).message}`);
    }
  }

  async getLogs(): Promise<ServiceLog[]> {
    try {
      return await this.fetchFromRedisList();
    } catch (err) {
      this.logger.debug(`ServiceLog fetch failed: ${(err as Error).message}`);
      return [];
    }
  }

  // ── Redis helpers ────────────────────────────────────────────────────────────
  // CacheService only exposes get/set (string). We simulate a capped list by
  // storing a JSON array at a single key. This is simple and sufficient for 50 entries.
  private async pushToRedisList(log: ServiceLog): Promise<void> {
    const raw = await this.cache.get(REDIS_KEY);
    const list: ServiceLog[] = raw ? (JSON.parse(raw) as ServiceLog[]) : [];
    list.unshift(log);
    if (list.length > MAX_LOGS) list.length = MAX_LOGS;
    // TTL: 24 hours — logs are ephemeral
    await this.cache.set(REDIS_KEY, JSON.stringify(list), 86_400);
  }

  private async fetchFromRedisList(): Promise<ServiceLog[]> {
    const raw = await this.cache.get(REDIS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ServiceLog[];
  }
}
