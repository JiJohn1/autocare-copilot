import { useEffect, useRef, useState } from 'react';
import { api, type ServiceLog } from '../api/client';
import { EVENT_CONFIG, formatTime, MetaChips } from './serviceLogUtils';

export function ServiceLogFab() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const prevCountRef = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.system.serviceLogs();
      setLogs(res.logs);
      if (!open) {
        const added = res.count - prevCountRef.current;
        if (added > 0) setNewCount((n) => n + added);
        prevCountRef.current = res.count;
      }
    } catch {
      // 조용히 실패
    } finally {
      setLoading(false);
    }
  };

  // 최초 로드
  useEffect(() => {
    void fetchLogs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 5초 자동 새로고침
  useEffect(() => {
    const t = setInterval(() => void fetchLogs(), 5_000);
    return () => clearInterval(t);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // 패널 열릴 때 배지 초기화
  useEffect(() => {
    if (open) {
      setNewCount(0);
      prevCountRef.current = logs.length;
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // 외부 클릭 시 패널 닫기
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div
      ref={panelRef}
      style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9000 }}
    >
      {/* ── 로그 패널 ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 0.75rem)',
          right: 0,
          width: '380px',
          maxWidth: 'calc(100vw - 2rem)',
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,24,57,0.18)',
          border: '1px solid rgba(196,198,209,0.25)',
          overflow: 'hidden',
          transformOrigin: 'bottom right',
          transition: 'opacity 180ms ease, transform 180ms ease',
          opacity: open ? 1 : 0,
          transform: open ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(8px)',
          pointerEvents: open ? 'all' : 'none',
        }}
      >
        {/* 패널 헤더 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #001839 0%, #002c5f 100%)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: '#00a2c8' }}
            >
              monitor_heart
            </span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#ffffff',
                fontFamily: 'Manrope, sans-serif',
                letterSpacing: '0.02em',
              }}
            >
              서비스 동작 로그
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {loading && (
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>동기화 중...</span>
            )}
            <button
              onClick={() => void fetchLogs()}
              title="새로고침"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)' }}
              >
                refresh
              </span>
            </button>
            <button
              onClick={() => setOpen(false)}
              title="닫기"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)' }}
              >
                close
              </span>
            </button>
          </div>
        </div>

        {/* 5초 갱신 안내 */}
        <div
          style={{
            padding: '6px 16px',
            background: '#f3f4f5',
            borderBottom: '1px solid rgba(196,198,209,0.2)',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '10px', color: '#747780' }}>
            RAG 파이프라인 · 벡터 검색 · LLM · Redis 캐시 · 5초 자동 갱신
          </span>
        </div>

        {/* 로그 목록 */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {logs.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 16px',
                gap: '8px',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 32, color: '#c4c6d1' }}
              >
                terminal
              </span>
              <p style={{ fontSize: '13px', color: '#747780', textAlign: 'center' }}>
                서비스 로그가 없습니다.
                <br />
                Chat 쿼리나 문서 업로드를 해보세요.
              </p>
            </div>
          ) : (
            <div style={{ padding: '8px' }}>
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
                    style={{
                      display: 'flex',
                      gap: '10px',
                      padding: '8px',
                      borderRadius: '8px',
                      marginBottom: '2px',
                      transition: 'background 120ms',
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.background = '#f8f9fa')
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLDivElement).style.background = 'transparent')
                    }
                  >
                    {/* 좌측 dot */}
                    <div style={{ paddingTop: '4px', flexShrink: 0 }}>
                      <div
                        className={cfg.dot}
                        style={{ width: '6px', height: '6px', borderRadius: '50%' }}
                      />
                    </div>
                    {/* 내용 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '2px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          className={`${cfg.badgeBg} ${cfg.badgeText}`}
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            letterSpacing: '0.05em',
                            flexShrink: 0,
                          }}
                        >
                          {cfg.label}
                        </span>
                        <span
                          style={{ fontSize: '10px', color: '#9da1aa', flexShrink: 0 }}
                        >
                          {formatTime(log.time)}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#191c1d',
                          lineHeight: 1.4,
                          wordBreak: 'break-word',
                        }}
                      >
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

      {/* ── FAB 버튼 ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="서비스 동작 로그"
        style={{
          position: 'relative',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: open
            ? 'linear-gradient(135deg, #002c5f 0%, #001839 100%)'
            : 'linear-gradient(135deg, #001839 0%, #002c5f 100%)',
          border: '2px solid rgba(0,162,200,0.35)',
          boxShadow: open
            ? '0 4px 20px rgba(0,24,57,0.35), 0 0 0 4px rgba(0,162,200,0.1)'
            : '0 4px 16px rgba(0,24,57,0.25)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 180ms ease',
          transform: open ? 'rotate(45deg) scale(1.05)' : 'rotate(0deg) scale(1)',
        }}
        onMouseEnter={(e) => {
          if (!open)
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              '0 6px 24px rgba(0,24,57,0.35), 0 0 0 4px rgba(0,162,200,0.15)';
        }}
        onMouseLeave={(e) => {
          if (!open)
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              '0 4px 16px rgba(0,24,57,0.25)';
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 22,
            color: '#00a2c8',
            transition: 'color 180ms',
          }}
        >
          {open ? 'close' : 'terminal'}
        </span>

        {/* 새 이벤트 배지 */}
        {!open && newCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '18px',
              height: '18px',
              borderRadius: '999px',
              background: '#00a2c8',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #ffffff',
              boxShadow: '0 2px 6px rgba(0,162,200,0.4)',
            }}
          >
            {newCount > 99 ? '99+' : newCount}
          </span>
        )}
      </button>
    </div>
  );
}
