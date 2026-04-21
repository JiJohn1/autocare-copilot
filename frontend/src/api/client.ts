const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  // When body is FormData let the browser set Content-Type (with boundary).
  // Otherwise default to application/json.
  const isFormData = options?.body instanceof FormData;
  const headers: Record<string, string> = isFormData
    ? {}
    : { 'Content-Type': 'application/json' };
  Object.assign(headers, options?.headers ?? {});

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}

export interface ChatSource {
  title: string;
  source: string;
  content: string;
  score: number;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  latency: number;
}

export interface DocumentChunk {
  id: string;
  title: string;
  source: string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface HealthResponse {
  status: string;
  db: string;
  redis: string;
}

export interface ErrorLog {
  time: string;
  type: string;
  detail: string;
  level: 'CRITICAL' | 'WARNING';
}

export interface WeeklyStat {
  date: string;   // 'YYYY-MM-DD'
  count: number;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: 'QUERY' | 'CACHE_HIT' | 'CACHE_MISS' | 'EMBED' | 'SEARCH' | 'LLM' | 'DOC_CREATED' | 'CACHE_SET';
  message: string;
  detail?: string;
  durationMs?: number;
}

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

export interface IngestResult {
  chunks: DocumentChunk[];
  total: number;
  skipped: number;
}

export interface IngestJob {
  jobId: string;
  status: 'processing' | 'done' | 'error';
  fileName: string;
  startedAt: string;
  finishedAt?: string;
  progress: {
    windows: number;
    windowsDone: number;
    chunksTotal: number;
    skipped: number;
  };
  error?: string;
  result?: { total: number; skipped: number };
}

export interface ServiceLog {
  id: string;
  time: string;
  event: ServiceEventType;
  detail: string;
  meta?: Record<string, unknown>;
}

export interface ServiceLogsResponse {
  logs: ServiceLog[];
  count: number;
}

export const api = {
  chat: {
    query: (question: string, topK = 3) =>
      request<ChatResponse>('/api/v1/chat/query', {
        method: 'POST',
        body: JSON.stringify({ question, topK }),
      }),
  },
  documents: {
    create: (payload: {
      title: string;
      source: string;
      content: string;
      metadata?: Record<string, unknown>;
    }) =>
      request<DocumentChunk>('/api/v1/documents', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    list: () => request<DocumentChunk[]>('/api/v1/documents'),
    upload: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return request<IngestJob>('/api/v1/documents/upload', {
        method: 'POST',
        body: formData,
      });
    },
    getJob: (jobId: string) =>
      request<IngestJob>(`/api/v1/documents/jobs/${jobId}`),
  },
  health: () => request<HealthResponse>('/api/v1/chat/health'),
  system: {
    logs:        () => request<ErrorLog[]>('/api/v1/system/logs'),
    weekly:      () => request<WeeklyStat[]>('/api/v1/system/weekly'),
    activity:    () => request<ActivityEvent[]>('/api/v1/system/activity'),
    serviceLogs: () => request<ServiceLogsResponse>('/api/v1/system/service-logs'),
  },
};
