import { Injectable } from '@nestjs/common';

export interface ErrorLog {
  time: string;          // 'HH:MM:SS'
  type: string;          // e.g. '404 Not Found'
  detail: string;        // request path or message
  level: 'CRITICAL' | 'WARNING';
}

@Injectable()
export class LogStoreService {
  private readonly logs: ErrorLog[] = [];
  private readonly MAX = 50;

  push(log: ErrorLog) {
    this.logs.unshift(log);
    if (this.logs.length > this.MAX) this.logs.pop();
  }

  getAll(): ErrorLog[] {
    return [...this.logs];
  }
}
