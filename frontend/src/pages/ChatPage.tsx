import { useState, useRef, useEffect } from 'react';
import { api, type ChatResponse } from '../api/client';
import { PageLogPanel } from '../components/PageLogPanel';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatResponse['sources'];
  latency?: number;
}

const SUGGESTIONS = [
  '엔진 오일 교체 주기는?',
  '타이어 공기압 권장 수치는?',
  '브레이크 패드 교체 시기는?',
  '에어컨 필터 교환 주기는?',
];

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mountTime   = useRef(new Date());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);
    try {
      const res = await api.chat.query(question);
      setMessages((prev) => [...prev, {
        role: 'assistant', content: res.answer, sources: res.sources, latency: res.latency,
      }]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e as unknown as React.FormEvent);
    }
  }

  return (
    <div className="flex-1 flex flex-row overflow-hidden h-full">

      {/* ── 좌측: 채팅 영역 ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">

          {/* 빈 상태 — 채팅 입력창과 동일한 좌측 정렬 */}
          {messages.length === 0 && (
            <div className="flex flex-col gap-5 pt-10">
              <div className="flex flex-col gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#001839] flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}>chat</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#001839]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    AutoCare Copilot
                  </h2>
                  <p className="text-sm text-[#43474f] mt-1">자동차 관련 질문을 입력하세요. 문서 기반으로 답변합니다.</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-[#747780] uppercase tracking-widest mb-2">예제 질문</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl">
                  {SUGGESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                      className="px-4 py-3 rounded-xl bg-white border border-[#c4c6d1]/30 text-sm text-[#191c1d] hover:bg-[#f3f4f5] hover:border-[#c4c6d1]/60 transition-all text-left shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 메시지 버블 */}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'user' ? (
                <div className="max-w-[80%] sm:max-w-[70%] bg-[#001839] text-white px-5 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed break-words">
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-[90%] sm:max-w-[78%] bg-white border border-[#c4c6d1]/20 rounded-2xl rounded-tl-sm p-5 space-y-3 shadow-sm">
                  <p className="text-sm text-[#191c1d] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>

                  {/* 참고 문서 */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <p className="text-xs font-bold text-[#43474f] uppercase tracking-widest">참고 문서</p>
                      {msg.sources.map((src, si) => (
                        <div key={si} className="p-3 rounded-lg bg-[#f3f4f5] border border-[#c4c6d1]/15">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="text-sm font-semibold text-[#001839] min-w-0 truncate">{src.title}</span>
                            <span className="text-xs font-bold text-[#00a2c8] bg-[#00a2c8]/10 px-2 py-0.5 rounded flex-shrink-0">
                              {(src.score * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs text-[#43474f] line-clamp-2 break-words">{src.content}</p>
                          <p className="text-[11px] text-[#747780] mt-1.5 font-mono">{src.source}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 지연 시간 */}
                  {msg.latency !== undefined && (
                    <p className="text-xs text-[#747780] flex items-center gap-1">
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>timer</span>
                      {msg.latency}ms
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* 로딩 인디케이터 */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#c4c6d1]/20 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1.5 items-center">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="w-1.5 h-1.5 bg-[#43474f] rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 에러 */}
          {error && (
            <div className="flex justify-center">
              <div className="px-4 py-2.5 rounded-xl bg-[#ffdad6]/40 border border-[#ba1a1a]/20 text-xs text-[#ba1a1a] max-w-sm">
                {error}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* 입력창 */}
        <div className="border-t border-[#c4c6d1]/20 bg-white/90 backdrop-blur-sm px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSubmit} className="flex gap-2.5">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="자동차 관련 질문 입력... (Shift+Enter 줄바꿈)"
              rows={1}
              className="flex-1 px-4 py-3 rounded-xl bg-[#f3f4f5] border border-[#c4c6d1]/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#001839]/20 focus:bg-white transition-all min-h-[46px] max-h-32"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-3 bg-[#001839] text-white rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-[#002c5f] active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>
              <span className="hidden sm:inline">전송</span>
            </button>
          </form>
        </div>
      </div>

      {/* ── 우측: 현재 화면 로그 패널 ── */}
      <PageLogPanel filterFrom={mountTime.current} />
    </div>
  );
}
