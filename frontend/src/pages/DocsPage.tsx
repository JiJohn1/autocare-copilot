import { useState, useEffect, useRef } from 'react';
import type { DragEvent } from 'react'
import { api, type DocumentChunk, type IngestJob } from '../api/client';
import { PageLogPanel } from '../components/PageLogPanel';

type Tab = 'manual' | 'upload';

export function DocsPage() {
  const [chunks,     setChunks]     = useState<DocumentChunk[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast,      setToast]      = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [form,       setForm]       = useState({ title: '', source: '', content: '', metadata: '' });

  // Tab + upload state
  const [activeTab,    setActiveTab]    = useState<Tab>('manual');
  const [dragOver,     setDragOver]     = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError,  setUploadError]  = useState('');
  const [job,          setJob]          = useState<IngestJob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setLoading(true);
    api.documents.list().then(setChunks).catch(() => setChunks([])).finally(() => setLoading(false));
  }, []);

  // 폴링: job이 processing 상태인 동안 5초마다 상태 조회
  useEffect(() => {
    if (job?.status === 'processing') {
      pollRef.current = setInterval(async () => {
        try {
          const updated = await api.documents.getJob(job.jobId);
          setJob(updated);
          if (updated.status === 'done') {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            const fresh = await api.documents.list();
            setChunks(fresh);
            showToast('success', `"${updated.fileName}" 업로드 완료 — ${updated.result?.total ?? 0}개 청크 저장됨`);
            setSelectedFile(null);
            setJob(null);
          } else if (updated.status === 'error') {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setUploadError(updated.error ?? '처리 중 오류가 발생했습니다.');
          }
        } catch {
          // 네트워크 오류 무시 — 다음 폴링에서 재시도
        }
      }, 5000);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [job?.jobId, job?.status]);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      let metadata: Record<string, unknown> = {};
      if (form.metadata.trim()) {
        try { metadata = JSON.parse(form.metadata); }
        catch { throw new Error('metadata가 올바른 JSON 형식이 아닙니다.'); }
      }
      const created = await api.documents.create({
        title: form.title, source: form.source, content: form.content, metadata,
      });
      setChunks((prev) => [created, ...prev]);
      setForm({ title: '', source: '', content: '', metadata: '' });
      showToast('success', '문서가 성공적으로 등록되었습니다.');
    } catch (err) {
      showToast('error', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleFileSelect(file: File) {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      setUploadError('PDF 또는 DOCX 파일만 업로드 가능합니다.');
      setSelectedFile(null);
      return;
    }
    if (file.size >35 * 1024 * 1024) {
      setUploadError('파일 크기는 35MB 이하여야 합니다.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setUploadError('');
    setJob(null);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploadError('');
    setJob(null);

    try {
      const ingestJob = await api.documents.upload(selectedFile);
      setJob(ingestJob); // 폴링 useEffect가 자동으로 시작됨
    } catch (err) {
      setUploadError((err as Error).message);
    }
  }

  const mountTime = useRef(new Date());
  const inputCls = 'w-full px-4 py-2.5 rounded-lg bg-[#f3f4f5] border border-[#c4c6d1]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#001839]/20 focus:bg-white transition-all';

  const isUploading = job?.status === 'processing';

  return (
    <div className="flex-1 flex overflow-hidden h-full">

      {/* ── 좌측: 기존 컨텐츠 ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-w-0">

      {/* 토스트 */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg ${
          toast.type === 'success' ? 'bg-[#001839] text-white' : 'bg-[#ba1a1a] text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* 등록 패널 */}
      <div className="bg-white rounded-xl border border-[#c4c6d1]/15 shadow-sm overflow-hidden">

        {/* 탭 헤더 */}
        <div className="flex gap-2 px-4 py-3 bg-white border-b border-[#c4c6d1]/20">
          {([
            { key: 'manual', label: '직접 입력', icon: 'edit_note' },
            { key: 'upload', label: '파일 업로드', icon: 'upload_file' },
          ] as { key: Tab; label: string; icon: string }[]).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex-1 justify-center border ${
                activeTab === key
                  ? 'bg-[#001839] text-white border-[#001839]'
                  : 'bg-white text-[#43474f] border-[#c4c6d1]/60 hover:border-[#001839]/40 hover:text-[#001839]'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-6">

          {/* ── 직접 입력 탭 ── */}
          {activeTab === 'manual' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#43474f] uppercase tracking-widest mb-1.5">제목 *</label>
                  <input
                    required value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="현대 아반떼 오너스 매뉴얼"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#43474f] uppercase tracking-widest mb-1.5">출처 (파일명) *</label>
                  <input
                    required value={form.source}
                    onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                    placeholder="avante_manual.pdf"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#43474f] uppercase tracking-widest mb-1.5">내용 *</label>
                <textarea
                  required rows={3} value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="엔진 오일은 주행거리 10,000km 또는 6개월마다 교체하세요."
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-[#43474f] uppercase tracking-widest mb-1.5">
                    Metadata <span className="normal-case font-normal text-[#747780]">(JSON, 선택)</span>
                  </label>
                  <input
                    value={form.metadata}
                    onChange={(e) => setForm((f) => ({ ...f, metadata: e.target.value }))}
                    placeholder='{"page": 42, "category": "maintenance"}'
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <button
                  type="submit" disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-3 bg-[#001839] text-white rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-[#002c5f] active:scale-95 transition-all flex-shrink-0"
                >
                  {submitting ? (
                    <><span className="material-symbols-outlined text-sm animate-spin">refresh</span>저장 중...</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm">upload</span>등록</>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── 파일 업로드 탭 ── */}
          {activeTab === 'upload' && (
            <div className="space-y-4">

              {/* 드롭존 */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-[#00a2c8] bg-[#00a2c8]/5'
                    : selectedFile
                    ? 'border-[#001839]/30 bg-[#001839]/3'
                    : 'border-[#c4c6d1]/40 hover:border-[#001839]/30 hover:bg-[#f3f4f5]/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                />

                {selectedFile ? (
                  <>
                    <span className="material-symbols-outlined text-[#001839]" style={{ fontSize: 40 }}>description</span>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-[#001839]">{selectedFile.name}</p>
                      <p className="text-xs text-[#747780] mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setJob(null); setUploadError(''); }}
                      className="text-xs text-[#747780] underline hover:text-[#ba1a1a] transition-colors"
                    >
                      파일 변경
                    </button>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[#c4c6d1]" style={{ fontSize: 44 }}>upload_file</span>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-[#43474f]">파일을 드래그하거나 클릭하여 선택</p>
                      <p className="text-xs text-[#747780] mt-1">PDF, DOCX 지원 · 최대 20MB</p>
                    </div>
                  </>
                )}
              </div>

              {/* 업로드 에러 */}
              {uploadError && (
                <div className="flex items-center gap-2 text-sm text-[#ba1a1a] bg-[#ba1a1a]/8 px-4 py-2.5 rounded-lg">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
                  {uploadError}
                </div>
              )}

              {/* 진행 상태 */}
              {isUploading && job && (
                <div className="px-4 py-3 bg-[#001839]/4 rounded-lg space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#001839] animate-spin" style={{ fontSize: 20 }}>refresh</span>
                    <p className="text-sm font-semibold text-[#001839]">
                      {job.progress.windows > 0
                        ? `처리 중... 윈도우 ${job.progress.windowsDone}/${job.progress.windows} 완료 · 저장된 청크 ${job.progress.chunksTotal}개`
                        : '처리 중... 파일 분석 중'}
                    </p>
                  </div>
                  {job.progress.windows > 0 ? (
                    <div className="h-1.5 w-full bg-[#c4c6d1]/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00a2c8] rounded-full transition-all duration-700"
                        style={{ width: `${Math.round((job.progress.windowsDone / job.progress.windows) * 100)}%` }}
                      />
                    </div>
                  ) : (
                    <div className="h-1.5 w-full bg-[#c4c6d1]/30 rounded-full overflow-hidden">
                      <div className="h-full bg-[#00a2c8] rounded-full animate-pulse" style={{ width: '15%' }} />
                    </div>
                  )}
                  {job.progress.windows > 0 && (
                    <p className="text-xs text-[#747780]">
                      {Math.round((job.progress.windowsDone / job.progress.windows) * 100)}%
                    </p>
                  )}
                </div>
              )}

              {/* 업로드 버튼 */}
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!selectedFile || isUploading}
                  onClick={handleUpload}
                  className="flex items-center gap-2 px-6 py-3 bg-[#00a2c8] text-white rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-[#0090b4] active:scale-95 transition-all"
                >
                  {isUploading ? (
                    <><span className="material-symbols-outlined text-sm animate-spin">refresh</span>처리 중...</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm">smart_toy</span>업로드 및 자동 분석</>
                  )}
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-xl border border-[#c4c6d1]/15 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-[#f3f4f5]/60 border-b border-[#c4c6d1]/15">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#001839]" style={{ fontSize: 20 }}>description</span>
            <h3 className="text-base font-bold text-[#001839]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              등록된 문서 Chunks
            </h3>
          </div>
          <span className="text-xs font-bold text-[#43474f] bg-[#e7e8e9] px-2.5 py-0.5 rounded-full">{chunks.length}개</span>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-[#43474f]">불러오는 중...</div>
        ) : chunks.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#43474f]">등록된 문서가 없습니다.</div>
        ) : (
          <>
            {/* 모바일: 카드 */}
            <div className="sm:hidden divide-y divide-[#c4c6d1]/10">
              {chunks.map((chunk) => (
                <div key={chunk.id} className="px-5 py-4 space-y-1">
                  <p className="text-sm font-semibold text-[#001839] truncate">{chunk.title}</p>
                  <p className="text-xs font-mono text-[#43474f]">{chunk.source}</p>
                  <p className="text-xs text-[#43474f] line-clamp-2">{chunk.content}</p>
                  <p className="text-xs text-[#747780]">{new Date(chunk.createdAt).toLocaleString('ko-KR')}</p>
                </div>
              ))}
            </div>

            {/* 데스크톱: 테이블 */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#f3f4f5]/30 border-b border-[#c4c6d1]/10">
                    {['제목', '출처', '내용 미리보기', '등록일'].map((h) => (
                      <th key={h} className="px-6 py-3 text-xs font-bold text-[#43474f] uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c4c6d1]/10">
                  {chunks.map((chunk) => (
                    <tr key={chunk.id} className="hover:bg-[#f3f4f5]/50 transition-colors">
                      <td className="px-6 py-3 text-sm font-semibold text-[#001839] max-w-[160px] truncate">{chunk.title}</td>
                      <td className="px-6 py-3 text-xs font-mono text-[#43474f] whitespace-nowrap">{chunk.source}</td>
                      <td className="px-6 py-3 text-sm text-[#191c1d] max-w-xs">
                        <p className="line-clamp-2">{chunk.content}</p>
                      </td>
                      <td className="px-6 py-3 text-sm text-[#43474f] whitespace-nowrap">
                        {new Date(chunk.createdAt).toLocaleString('ko-KR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      </div>{/* ── 좌측 컬럼 끝 ── */}

      {/* ── 우측: 현재 화면 로그 패널 ── */}
      <PageLogPanel filterFrom={mountTime.current} />
    </div>
  );
}
