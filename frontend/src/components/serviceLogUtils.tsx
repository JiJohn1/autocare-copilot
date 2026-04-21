import { type ServiceEventType } from '../api/client';

export const EVENT_CONFIG: Record<
  ServiceEventType,
  { label: string; badgeBg: string; badgeText: string; dot: string }
> = {
  CHAT_QUERY:           { label: 'CHAT QUERY',   badgeBg: 'bg-blue-100',        badgeText: 'text-blue-700',      dot: 'bg-blue-500' },
  VECTOR_SEARCH:        { label: 'VECTOR SEARCH', badgeBg: 'bg-purple-100',      badgeText: 'text-purple-700',    dot: 'bg-purple-500' },
  RETRIEVAL_RESULT:     { label: 'RETRIEVAL',     badgeBg: 'bg-purple-100',      badgeText: 'text-purple-700',    dot: 'bg-purple-400' },
  CACHE_HIT:            { label: 'CACHE HIT',     badgeBg: 'bg-green-100',       badgeText: 'text-green-700',     dot: 'bg-green-500' },
  CACHE_MISS:           { label: 'CACHE MISS',    badgeBg: 'bg-orange-100',      badgeText: 'text-orange-700',    dot: 'bg-orange-500' },
  LLM_CALL:             { label: 'LLM CALL',      badgeBg: 'bg-[#e0f6fb]',       badgeText: 'text-[#005f78]',     dot: 'bg-[#00a2c8]' },
  LLM_RESPONSE:         { label: 'LLM RESP',      badgeBg: 'bg-[#e0f6fb]',       badgeText: 'text-[#005f78]',     dot: 'bg-[#00a2c8]' },
  DOC_INGEST:           { label: 'DOC INGEST',    badgeBg: 'bg-gray-100',        badgeText: 'text-gray-600',      dot: 'bg-gray-400' },
  FILE_PARSE:           { label: 'FILE PARSE',    badgeBg: 'bg-yellow-100',      badgeText: 'text-yellow-700',    dot: 'bg-yellow-500' },
  CHUNK_PLAN:           { label: 'CHUNK PLAN',    badgeBg: 'bg-pink-100',        badgeText: 'text-pink-700',      dot: 'bg-pink-400' },
  FILE_INGEST_COMPLETE: { label: 'INGEST DONE',   badgeBg: 'bg-green-100',       badgeText: 'text-green-700',     dot: 'bg-green-600' },
};

export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function MetaChips({ meta }: { meta: Record<string, unknown> }) {
  const entries = Object.entries(meta).filter(([, v]) => v !== null && v !== undefined);
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map(([k, v]) => (
        <span
          key={k}
          className="inline-flex items-center gap-0.5 text-[10px] font-mono bg-white/60 border border-gray-200 rounded px-1 py-0.5 text-gray-500"
        >
          <span className="text-gray-400">{k}:</span>
          <span>{String(v)}</span>
        </span>
      ))}
    </div>
  );
}
