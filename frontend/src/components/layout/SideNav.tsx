import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/chat',      icon: 'chat',            label: '채팅' },
  { to: '/docs',      icon: 'description',     label: '문서 관리' },
  { to: '/retrieval', icon: 'database_search', label: '검색 테스트' },
  { to: '/system',    icon: 'monitoring',      label: '시스템' },
];

interface SideNavProps {
  open: boolean;
  onClose: () => void;
}

export function SideNav({ open, onClose }: SideNavProps) {
  const location = useLocation();

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      {/* 로고 */}
      <div className="px-5 py-5 flex items-center justify-between border-b border-[#c4c6d1]/15">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#001839] flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white" style={{ fontSize: 18 }}>settings_suggest</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-[#001839] truncate leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              AutoCare Copilot
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-[#455f7e] opacity-60">RAG Backend v1.0</p>
          </div>
        </div>
        <button
          className="sidebar-close-btn p-1.5 rounded-lg hover:bg-[#e7e8e9] text-[#43474f]"
          onClick={onClose}
          aria-label="Close menu"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
        </button>
      </div>

      {/* 섹션 레이블 */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-[11px] font-bold text-[#747780] uppercase tracking-widest">메뉴</p>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={[
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white text-[#001839] font-bold shadow-sm border-r-2 border-[#001839]'
                  : 'text-[#43474f] hover:bg-[#e7e8e9]',
              ].join(' ')}
            >
              <span
                className="material-symbols-outlined flex-shrink-0"
                style={{ fontSize: 22, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {icon}
              </span>
              <span className="truncate text-[15px]">{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* 하단 여백만 */}
      <div className="h-6" />
    </aside>
  );
}
