interface TopNavProps {
  title: string;
  onMenuClick: () => void;
}

export function TopNav({ title, onMenuClick }: TopNavProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-[#c4c6d1]/20 shadow-[0_1px_8px_rgba(0,24,57,0.04)]">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6">
        {/* 왼쪽: 햄버거(모바일) + 페이지 타이틀 */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="hamburger-btn p-2 -ml-1 rounded-lg hover:bg-[#e7e8e9] text-[#43474f] flex-shrink-0"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>menu</span>
          </button>
          <span
            className="text-base font-extrabold tracking-tight text-[#001839] truncate"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            {title}
          </span>
        </div>

        {/* 오른쪽: 아이콘 액션 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button className="p-2 rounded-lg hover:bg-[#e7e8e9] text-[#43474f] transition-colors" title="알림">
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>notifications</span>
          </button>
          <button className="p-2 rounded-lg hover:bg-[#e7e8e9] text-[#43474f] transition-colors" title="설정">
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>settings</span>
          </button>
          <div className="hidden sm:block h-5 w-px bg-[#c4c6d1]/40 mx-2" />
          <span className="hidden sm:block material-symbols-outlined text-[#abc7ff]" style={{ fontSize: 32 }}>account_circle</span>
        </div>
      </div>
    </header>
  );
}
