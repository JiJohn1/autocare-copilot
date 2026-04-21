import { useEffect, useState } from 'react';
import { api, type HealthResponse, type ErrorLog, type WeeklyStat } from '../api/client';

const KO_DAYS = ['일', '월', '화', '수', '목', '금', '토'];
function toKoDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return KO_DAYS[new Date(y, m - 1, d).getDay()];
}
function statusLabel(val: string | undefined): string {
  if (val === 'connected')    return '연결됨';
  if (val === 'disconnected') return '연결 끊김';
  return val ?? '...';
}
function downloadCsv(logs: ErrorLog[]) {
  const header = '시각,오류 유형,상세,등급\n';
  const rows   = logs.map((l) => `${l.time},${l.type},"${l.detail}",${l.level}`).join('\n');
  const blob   = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href = url;
  a.download = `error_logs_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function SystemPage() {
  const [health,   setHealth]   = useState<HealthResponse | null>(null);
  const [latency,  setLatency]  = useState<number | null>(null);
  const [docCount, setDocCount] = useState<number | null>(null);
  const [logs,     setLogs]     = useState<ErrorLog[]>([]);
  const [weekly,   setWeekly]   = useState<WeeklyStat[]>([]);

  useEffect(() => {
    function checkHealth() {
      const start = Date.now();
      api.health()
        .then((h) => { setHealth(h); setLatency(Date.now() - start); })
        .catch(() => setHealth({ status: 'error', db: 'disconnected', redis: 'disconnected' }));
    }
    checkHealth();
    const t = setInterval(checkHealth, 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    api.documents.list().then((d) => setDocCount(d.length)).catch(() => setDocCount(0));
  }, []);

  useEffect(() => {
    function fetchSystemData() {
      api.system.logs().then(setLogs).catch(() => setLogs([]));
      api.system.weekly().then(setWeekly).catch(() => setWeekly([]));
    }
    fetchSystemData();
    const t = setInterval(fetchSystemData, 30_000);
    return () => clearInterval(t);
  }, []);

  const isOk   = health?.db === 'connected' && health?.redis === 'connected';
  const maxCnt = Math.max(...weekly.map((w) => w.count), 1);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 p-4 sm:p-6 space-y-4 w-full max-w-7xl mx-auto">

        {/* ── 상태 뱃지 스트립 (TopNav에 타이틀 있으므로 h2 제거) ── */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#43474f]">검색 클러스터 실시간 진단 · 30초 자동 갱신</p>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-bold ${
            isOk
              ? 'bg-[#00a2c8]/10 border-[#00a2c8]/30 text-[#00a2c8]'
              : 'bg-[#ffdad6]/50 border-[#ba1a1a]/20 text-[#ba1a1a]'
          }`}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOk ? 'bg-[#00a2c8] animate-pulse' : 'bg-[#ba1a1a]'}`} />
            {health ? (isOk ? '정상 운영 중' : '장애 감지') : '확인 중...'}
          </div>
        </div>

        {/* ── 메트릭 카드 4개 ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              icon: 'dns', iconColor: 'text-[#001839]', iconBg: 'bg-[#002c5f]/10',
              badge: statusLabel(health?.db),
              badgeCls: health?.db === 'connected' ? 'bg-[#00a2c8]/10 text-[#00a2c8]' : 'bg-[#ffdad6] text-[#ba1a1a]',
              label: 'PostgreSQL + pgvector',
              value: health?.db === 'connected' ? '온라인' : health ? '오프라인' : '—',
            },
            {
              icon: 'bolt', iconColor: 'text-[#002c5f]', iconBg: 'bg-[#d7e3ff]/40',
              badge: statusLabel(health?.redis),
              badgeCls: health?.redis === 'connected' ? 'bg-[#00a2c8]/10 text-[#00a2c8]' : 'bg-[#ffdad6] text-[#ba1a1a]',
              label: 'Redis 캐시',
              value: health?.redis === 'connected' ? '온라인' : health ? '오프라인' : '—',
            },
            {
              icon: 'timer', iconColor: 'text-[#46607f]', iconBg: 'bg-[#bfd9fd]/30',
              badge: '헬스체크', badgeCls: 'bg-[#bfd9fd]/40 text-[#455f7e]',
              label: '응답 지연시간',
              value: latency !== null ? `${latency}ms` : '—',
            },
            {
              icon: 'description', iconColor: 'text-[#001839]', iconBg: 'bg-[#002c5f]/10',
              badge: '실시간', badgeCls: 'bg-[#bfd9fd]/40 text-[#455f7e]',
              label: '등록된 문서 Chunk',
              value: docCount !== null ? `${docCount}개` : '—',
            },
          ].map(({ icon, iconColor, iconBg, badge, badgeCls, label, value }) => (
            <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-[#c4c6d1]/15">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2 ${iconBg} rounded-lg`}>
                  <span className={`material-symbols-outlined ${iconColor}`} style={{ fontSize: 20 }}>{icon}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${badgeCls}`}>{badge}</span>
              </div>
              <p className="text-xs font-semibold text-[#43474f] uppercase tracking-wider leading-tight">{label}</p>
              <p className="text-2xl font-extrabold text-[#001839] mt-1.5" style={{ fontFamily: 'Manrope, sans-serif' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── 일별 문서 등록 현황 ── */}
        <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#c4c6d1]/15">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#001839]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                일별 문서 등록 현황
              </h3>
              <p className="text-sm text-[#43474f] mt-0.5">최근 7일 · document_chunks 실제 등록 건수</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-[#00a2c8]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {weekly.reduce((s, w) => s + w.count, 0)}
              </p>
              <p className="text-xs font-bold text-[#43474f] uppercase tracking-tight">7일 합계</p>
            </div>
          </div>

          {weekly.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-sm text-[#43474f]">로딩 중...</div>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {weekly.map(({ date, count }) => {
                const pct    = Math.round((count / maxCnt) * 100);
                const isMax  = count === maxCnt && count > 0;
                return (
                  <div key={date} className="flex flex-col items-center flex-1 gap-1 min-w-0 group relative">
                    <div className="absolute bottom-full mb-1 hidden group-hover:flex justify-center pointer-events-none">
                      <span className="text-xs font-bold bg-[#001839] text-white px-2 py-0.5 rounded whitespace-nowrap">
                        {count}건
                      </span>
                    </div>
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        count === 0 ? 'bg-[#e7e8e9]'
                          : isMax ? 'bg-[#002c5f] shadow-sm'
                          : 'bg-[#002c5f]/35 hover:bg-[#002c5f]/55'
                      }`}
                      style={{ height: count === 0 ? '3px' : `${Math.max(pct, 8)}%` }}
                    />
                    <span className={`text-xs font-bold ${isMax ? 'text-[#001839]' : 'text-[#747780]'}`}>
                      {toKoDay(date)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 오류 로그 ── */}
        <div className="bg-white rounded-xl shadow-sm border border-[#c4c6d1]/15 overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-[#f3f4f5]/60 border-b border-[#c4c6d1]/15">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ba1a1a]" style={{ fontSize: 20 }}>warning</span>
              <h3 className="text-base font-bold text-[#001839]" style={{ fontFamily: 'Manrope, sans-serif' }}>오류 로그</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#e7e8e9] text-[#747780]">{logs.length}건</span>
            </div>
            <button
              onClick={() => downloadCsv(logs)}
              disabled={logs.length === 0}
              className="text-sm font-semibold text-[#001839] hover:underline disabled:opacity-30 flex items-center gap-1"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>download</span>
              CSV
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#43474f]">기록된 오류가 없습니다.</div>
          ) : (
            <>
              {/* 모바일 */}
              <div className="sm:hidden divide-y divide-[#c4c6d1]/10">
                {logs.map((log, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-bold ${log.level === 'CRITICAL' ? 'text-[#ba1a1a]' : 'text-[#2e4866]'}`}>{log.type}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${log.level === 'CRITICAL' ? 'bg-[#ffdad6]/50 text-[#ba1a1a]' : 'bg-[#bfd9fd]/40 text-[#455f7e]'}`}>
                        {log.level === 'CRITICAL' ? '치명' : '경고'}
                      </span>
                    </div>
                    <p className="text-xs text-[#43474f] font-mono truncate">{log.detail}</p>
                    <p className="text-xs text-[#747780] mt-1">{log.time}</p>
                  </div>
                ))}
              </div>

              {/* 데스크톱 */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#f3f4f5]/30 border-b border-[#c4c6d1]/10">
                      {['시각', '오류 유형', '경로', '등급'].map((h) => (
                        <th key={h} className="px-6 py-3 text-xs font-bold text-[#43474f] uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c4c6d1]/10">
                    {logs.map((log, i) => (
                      <tr key={i} className="hover:bg-[#f3f4f5]/50 transition-colors">
                        <td className="px-6 py-3 text-sm font-medium text-[#191c1d] whitespace-nowrap">{log.time}</td>
                        <td className="px-6 py-3 text-sm font-bold whitespace-nowrap" style={{ color: log.level === 'CRITICAL' ? '#ba1a1a' : '#2e4866' }}>{log.type}</td>
                        <td className="px-6 py-3 text-sm text-[#43474f] max-w-xs truncate font-mono">{log.detail}</td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${log.level === 'CRITICAL' ? 'bg-[#ffdad6]/50 text-[#ba1a1a]' : 'bg-[#bfd9fd]/40 text-[#455f7e]'}`}>
                            {log.level === 'CRITICAL' ? '치명' : '경고'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* ── 인프라 요약 스트립 (기존 대형 배너 → 콤팩트 카드 2개) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
          <div className="rounded-xl bg-gradient-to-r from-[#001839] to-[#002c5f] p-5 flex items-center gap-4">
            <span className="material-symbols-outlined text-white/60" style={{ fontSize: 24 }}>deployed_code</span>
            <div>
              <p className="text-white text-base font-bold leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>인프라 상태</p>
              <p className="text-white/60 text-sm mt-0.5">
                {health ? (isOk ? 'Docker 컨테이너 전체 정상' : '상태 이상 감지') : '확인 중...'}
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-[#003240] to-[#001839] p-5 flex items-center gap-4">
            <span className="material-symbols-outlined text-white/60" style={{ fontSize: 24 }}>bolt</span>
            <div>
              <p className="text-white text-base font-bold leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>추론 지연시간</p>
              <p className="text-white/60 text-sm mt-0.5">
                {latency !== null ? `헬스체크 ${latency}ms · pgvector 코사인 검색` : 'pgvector RAG 파이프라인'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 푸터 ── */}
      <footer className="px-4 sm:px-6 py-3 border-t border-[#c4c6d1]/15 bg-[#f3f4f5]/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#43474f] uppercase tracking-widest">AutoCare Copilot v1.0</span>
          <div className="flex items-center gap-4">
            {[{ label: 'PostgreSQL', val: health?.db }, { label: 'Redis', val: health?.redis }].map(({ label, val }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${val === 'connected' ? 'bg-[#00a2c8]' : 'bg-[#ba1a1a]'}`} />
                <span className="text-xs text-[#43474f]">{label}: {statusLabel(val)}</span>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
