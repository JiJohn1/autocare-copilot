import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export type ActivityEventType =
  | 'QUERY'
  | 'CACHE_HIT'
  | 'CACHE_MISS'
  | 'EMBED'
  | 'SEARCH'
  | 'LLM'
  | 'DOC_CREATED'
  | 'CACHE_SET';

export interface ActivityEvent {
  id: string;
  timestamp: string;   // ISO 8601
  type: ActivityEventType;
  message: string;
  detail?: string;
  durationMs?: number;
}

type PushInput = Omit<ActivityEvent, 'id' | 'timestamp'>;

@Injectable()
export class ActivityLogService {
  private readonly events: ActivityEvent[] = [];
  private readonly MAX = 100;

  push(input: PushInput): void {
    const event: ActivityEvent = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ...input,
    };
    this.events.unshift(event);
    if (this.events.length > this.MAX) this.events.pop();
  }

  getAll(): ActivityEvent[] {
    return [...this.events];
  }
}
