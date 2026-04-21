import { useRef, useState } from 'react';
import { api, type ChatSource } from '../api/client';
import { PageLogPanel } from '../components/PageLogPanel';

export function RetrievalPage() {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<ChatSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const mountTime = useRef(new Date());

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await api.chat.query(query.trim(), 5);
      setResults(res.sources);
    } catch (err) {
      setError((err as Error).message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden h-full">

      {/* ── 좌측: 검색 컨텐츠 ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-w-0">

        {/* 검색 폼 */}
        <div className="bg-white rounded-xl border border-[#c4c6d1]/15 shadow-sm p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-[#001839]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              벡터 검색 디버그
            </h2>
            <p className="text-sm text-[#43474f] mt-1">질문어 입력 → pgvector 코사인 유사도 검색 결과 확인</p>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2.5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="검색할 질문을 입력하세요..."
              className="flex-1 px-4 py-3 rounded-lg bg-[#f3f4f5] border border-[#c4c6d1]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#001839]/20 focus:bg-white transition-all min-w-0"
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="flex items-center gap-1.5 px-5 py-3 bg-[#001839] text-white rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-[#002c5f] active:scale-95 transition-all flex-shrink-0"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>search</span>
              <span className="hidden sm:inline">검색</span>
            </button>
          </form>
        </div>

        {/* 에러 */}
        {error && (
          <div className="px-5 py-3 rounded-xl bg-[#ffdad6]/40 border border-[#ba1a1a]/20 text-sm text-[#ba1a1a]">
            {error}
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#001839]/20 border-t-[#001839] animate-spin" />
            <p className="text-sm text-[#43474f]">벡터 검색 중...</p>
          </div>
        )}

        {/* 결과 */}
        {!loading && searched && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-[#43474f] uppercase tracking-widest px-1">
              검색 결과 {results.length}개
            </p>

            {results.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-xl border border-[#c4c6d1]/15 shadow-sm text-sm text-[#43474f]">
                유사도 임계값을 넘는 문서가 없습니다.
              </div>
            ) : (
              results.map((src, i) => {
                const scoreColor =
                  src.score >= 0.85 ? '#00a2c8' : src.score >= 0.65 ? '#46607f' : '#ba1a1a';
                return (
                  <div key={i} className="bg-white rounded-xl border border-[#c4c6d1]/15 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-[#001839] truncate">{src.title}</p>
                        <p className="text-xs font-mono text-[#747780] mt-0.5">{src.source}</p>
                      </div>
                      <span
                        className="text-sm font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
                        style={{ color: scoreColor, backgroundColor: `${scoreColor}18` }}
                      >
                        {(src.score * 100).toFixed(1)}%
                      </span>
                    </div>

                    {/* 스코어 바 */}
                    <div className="w-full h-1.5 bg-[#e7e8e9] rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${src.score * 100}%`, backgroundColor: scoreColor }}
                      />
                    </div>

                    <p className="text-sm text-[#191c1d] leading-relaxed break-words">{src.content}</p>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>{/* ── 좌측 컬럼 끝 ── */}

      {/* ── 우측: 현재 화면 로그 패널 ── */}
      <PageLogPanel filterFrom={mountTime.current} />
    </div>
  );
}
