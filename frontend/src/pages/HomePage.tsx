import { Link } from 'react-router-dom';

const STEPS = [
  {
    num: '01',
    to: '/docs',
    icon: 'description',
    title: '문서 등록',
    subtitle: '직접 입력 또는 파일 업로드',
    desc: 'PDF · DOCX 파일을 업로드하거나 텍스트를 직접 입력하세요. 자동으로 청킹 · 임베딩되어 벡터 DB에 저장됩니다.',
    note: '테스트용 PDF를 다운로드해 바로 업로드해보세요',
    noteIcon: 'download',
    downloadUrl: '/AutoCare_Copilot_Test.pdf',
    downloadName: 'AutoCare_Copilot_Test.pdf',
    pipeline: [
      { icon: 'upload_file',         label: '파일 파싱',      detail: 'pdf-parse / mammoth' },
      { icon: 'auto_awesome_mosaic', label: 'Sliding Window 청킹', detail: 'chunk + overlap' },
      { icon: 'hub',                 label: 'Embedding 생성', detail: 'text-embedding-3-small' },
      { icon: 'database',            label: 'pgvector 저장',  detail: 'PostgreSQL' },
    ],
    cta: '문서 등록하기',
    ctaColor: 'bg-[#001839] hover:bg-[#002c5f]',
  },
  {
    num: '02',
    to: '/retrieval',
    icon: 'database_search',
    title: '검색 테스트',
    subtitle: 'pgvector 유사도 검색',
    desc: '질의를 입력하면 cosine similarity 기반으로 관련 문서 chunk를 검색하고, 유사도 점수와 함께 결과를 확인합니다.',
    note: '벡터 검색 성능을 점수로 직접 확인 가능',
    noteIcon: 'database_search',
    downloadUrl: undefined,
    downloadName: undefined,
    pipeline: [
      { icon: 'hub',             label: '질의 Embedding 변환', detail: 'text-embedding-3-small' },
      { icon: 'database_search', label: 'cosine similarity',   detail: 'pgvector <=> operator' },
      { icon: 'sort',            label: '상위 K개 반환',       detail: '점수 · 출처 포함' },
    ],
    cta: '검색 테스트하기',
    ctaColor: 'bg-[#005f8a] hover:bg-[#004c6e]',
  },
  {
    num: '03',
    to: '/chat',
    icon: 'chat',
    title: 'AI 채팅',
    subtitle: 'RAG 기반 문서 근거 답변',
    desc: '자동차 관련 질문을 입력하면 문서 검색 → 프롬프트 조합 → LLM 생성 전체 파이프라인이 동작합니다.',
    note: '동일 질문은 Redis 캐시로 즉시 응답',
    noteIcon: 'bolt',
    downloadUrl: undefined,
    downloadName: undefined,
    pipeline: [
      { icon: 'database_search',          label: 'Retrieval',    detail: 'pgvector 검색' },
      { icon: 'integration_instructions', label: 'Prompt 조합',  detail: '컨텍스트 + 시스템 프롬프트' },
      { icon: 'smart_toy',                label: 'LLM 생성',     detail: 'GPT-4o-mini' },
      { icon: 'bolt',                     label: 'Redis 캐시',   detail: '동일 질문 즉시 응답' },
    ],
    cta: '채팅 시작하기',
    ctaColor: 'bg-[#00838f] hover:bg-[#006875]',
  },
];

const TECH = [
  { icon: 'hub',           label: 'NestJS + Fastify' },
  { icon: 'database',      label: 'PostgreSQL + pgvector' },
  { icon: 'bolt',          label: 'Redis Cache' },
  { icon: 'smart_toy',     label: 'OpenAI API' },
  { icon: 'deployed_code', label: 'Docker + GCP VM' },
];

export function HomePage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f9fa]">

      {/* ── Hero ── */}
      <div className="bg-[#001839] text-white px-6 py-3 sm:px-10 sm:py-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-6">

          {/* 왼쪽: 타이틀 + 설명 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>settings_suggest</span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">RAG Backend Demo · v1.1</p>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold leading-tight mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              자동차 문서 기반&nbsp;<span className="text-[#00c8e6]">RAG 백엔드 서비스</span>
            </h1>
            <p className="text-xs text-white/60 leading-relaxed">
              문서를 업로드하면 자동으로 청킹 · 임베딩되어 벡터 DB에 저장됩니다.
              유사도 검색과 LLM 기반 답변 생성을 직접 체험하세요.
            </p>
          </div>

          {/* 오른쪽: 기술 스택 */}
          <div className="flex flex-row sm:flex-col flex-wrap sm:flex-nowrap gap-1.5 sm:w-44 flex-shrink-0">
            {TECH.map(({ icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/8 text-[11px] font-semibold text-white/70">
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{icon}</span>
                {label}
              </span>
            ))}
          </div>

        </div>
      </div>

      {/* ── 3단계 가이드 ── */}
      <div className="px-4 sm:px-8 pt-3 sm:pt-5 pb-3 sm:pb-5">

        <div className="mb-2 sm:mb-4">
          <p className="text-[10px] sm:text-xs font-bold text-[#747780] uppercase tracking-widest mb-0.5">사용 방법</p>
          <h2 className="text-lg sm:text-xl font-bold text-[#001839]" style={{ fontFamily: 'Manrope, sans-serif' }}>
            3단계로 RAG 파이프라인을 체험하세요
          </h2>
        </div>

        {/* 스텝 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-2 sm:mb-3">
          {STEPS.map((step) => (
            <div key={step.num} className="bg-white rounded-xl border border-[#c4c6d1]/20 shadow-sm flex flex-col overflow-hidden">

              {/* 카드 상단 */}
              <div className="px-4 sm:px-5 pt-4 pb-2.5 border-b border-[#c4c6d1]/10">
                <div className="flex items-start justify-between mb-1.5">
                  <span className="text-3xl sm:text-4xl font-black text-[#c4c6d1]/50 leading-none select-none" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {step.num}
                  </span>
                  <span className="material-symbols-outlined text-[#001839]" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>
                    {step.icon}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#001839] leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {step.title}
                </h3>
                <p className="text-[10px] sm:text-xs font-semibold text-[#747780] uppercase tracking-wider mt-0.5">{step.subtitle}</p>
              </div>

              {/* 설명 */}
              <div className="px-4 sm:px-5 py-2.5 border-b border-[#c4c6d1]/10">
                <p className="text-xs sm:text-sm text-[#43474f] leading-relaxed">{step.desc}</p>
              </div>

              {/* 파이프라인 */}
              <div className="px-4 sm:px-5 py-2.5 border-b border-[#c4c6d1]/10 flex-1">
                <p className="text-[9px] sm:text-[10px] font-bold text-[#747780] uppercase tracking-widest mb-2">파이프라인</p>
                <div className="space-y-1.5">
                  {step.pipeline.map((p, pi) => (
                    <div key={pi} className="flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-[#001839]/8 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[#001839]" style={{ fontSize: 12 }}>{p.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#191c1d] leading-tight">{p.label}</p>
                        <p className="text-[10px] text-[#747780] leading-tight truncate">{p.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 노트 + CTA */}
              <div className="px-4 sm:px-5 py-2.5 space-y-1.5">
                {step.downloadUrl ? (
                  <a
                    href={step.downloadUrl}
                    download={step.downloadName}
                    className="flex items-center gap-1.5 w-full px-3 py-1.5 rounded-lg border border-[#00838f]/40 bg-[#00838f]/6 text-[10px] font-semibold text-[#00838f] hover:bg-[#00838f]/12 transition-all"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>download</span>
                    <span className="flex-1">{step.note}</span>
                    <span className="text-[9px] font-mono text-[#00838f]/70">PDF · 138KB</span>
                  </a>
                ) : (
                  <p className="text-[10px] text-[#00838f] font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: 11 }}>{step.noteIcon}</span>
                    {step.note}
                  </p>
                )}
                <Link
                  to={step.to}
                  className={`flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white transition-all active:scale-95 ${step.ctaColor}`}
                >
                  {step.cta}
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_forward</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* 시스템 모니터링 */}
        <div className="bg-white rounded-xl border border-[#c4c6d1]/20 shadow-sm px-5 sm:px-6 py-3 sm:py-4 flex items-center gap-4">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#001839]/8 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[#001839]" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>monitoring</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#001839]">시스템 모니터링</p>
            <p className="text-xs text-[#43474f]">
              RAG 파이프라인 상태, pgvector 헬스체크, Redis 연결, 응답 지연 시간, 문서 chunk 수 실시간 확인
            </p>
          </div>
          <Link
            to="/system"
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[#c4c6d1]/50 text-xs font-semibold text-[#43474f] hover:border-[#001839]/40 hover:text-[#001839] hover:bg-[#f3f4f5] transition-all flex-shrink-0"
          >
            바로가기
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
