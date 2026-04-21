import { useEffect, useRef, useState } from 'react';
import { api, type ServiceLog } from '../api/client';
import { EVENT_CONFIG, formatTime, MetaChips } from './serviceLogUtils';

interface Props {
  /** 이 시간 이후에 발생한 로그만 표시 (페이지 진입 시각) */
  filterFrom: Date;
}

export function PageLogPanel({ filterFrom }: Props) {
  const [logs, setLogs]     = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.system.serviceLogs();
      const filtered = res.logs.filter((log) => new Date(log.time) >= filterFrom);
      setLogs(filtered);
    } catch {
      // 조용히 실패
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchLogs(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setInterval(() => void fetchLogs(), 5_000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 새 로그 추가 시 자동 스크롤
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-72 xl:w-80 border-l border-[#c4c6d1]/20 bg-[#fafafa] flex-col flex-shrink-0 hidden lg:flex">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-[#001839] flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#00a2c8]" style={{ fontSize: 14 }}>
            monitor_heart
          </span>
          <span className="text-xs font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
            현재 화면 로그
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#00a2c8',
              background: 'rgba(0,162,200,0.15)',
              border: '1px solid rgba(0,162,200,0.3)',
              borderRadius: '999px',
              padding: '1px 6px',
            }}
          >
            {logs.length}건
          </span>
        </div>
        {loading && (
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>동기화 중...</span>
        )}
      </div>

      {/* 부제목 */}
      <div className="px-3 py-1.5 bg-[#f3f4f5] border-b border-[#c4c6d1]/20 flex-shrink-0">
        <span className="text-[9px] text-[#747780]">
          현재 페이지 진입 이후 이벤트 · 5초 갱신
        </span>
      </div>

      {/* 로그 목록 */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 px-3">
            <span className="material-symbols-outlined text-[#c4c6d1]" style={{ fontSize: 28 }}>
              terminal
            </span>
            <p className="text-[11px] text-[#747780] text-center leading-relaxed">
              이 화면에서 발생한
              <br />
              로그가 없습니다.
            </p>
          </div>
        ) : (
          <div className="p-2">
            {logs.map((log) => {
              const cfg = EVENT_CONFIG[log.event] ?? {
                label: log.event,
                badgeBg: 'bg-gray-100',
                badgeText: 'text-gray-600',
                dot: 'bg-gray-400',
              };
              return (
                <div
                  key={log.id}
                  className="flex gap-2 p-2 rounded-lg hover:bg-white transition-colors mb-0.5"
                >
                  {/* dot */}
                  <div className="pt-[5px] flex-shrink-0">
                    <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  </div>
                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap mb-0.5">
                      <span
                        className={`${cfg.badgeBg} ${cfg.badgeText}`}
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: '9px', color: '#9da1aa' }}>
                        {formatTime(log.time)}
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#191c1d', lineHeight: 1.45, wordBreak: 'break-word' }}>
                      {log.detail}
                    </p>
                    {log.meta && Object.keys(log.meta).length > 0 && (
                      <MetaChips meta={log.meta} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
