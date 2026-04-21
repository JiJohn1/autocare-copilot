export type JobStatus = 'processing' | 'done' | 'error';

export interface IngestJob {
  jobId: string;
  status: JobStatus;
  fileName: string;
  startedAt: string;          // ISO timestamp
  finishedAt?: string;
  progress: {
    windows: number;          // 전체 윈도우 수
    windowsDone: number;      // 처리 완료 윈도우 수
    chunksTotal: number;      // 저장 완료 청크 수
    skipped: number;
  };
  error?: string;             // 에러 메시지 (status === 'error' 일 때)
  result?: {                  // status === 'done' 일 때
    total: number;
    skipped: number;
  };
}
