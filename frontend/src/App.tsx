import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SideNav } from './components/layout/SideNav';
import { TopNav } from './components/layout/TopNav';
import { ServiceLogFab } from './components/ServiceLogFab';
import { ChatPage } from './pages/ChatPage';
import { DocsPage } from './pages/DocsPage';
import { RetrievalPage } from './pages/RetrievalPage';
import { SystemPage } from './pages/SystemPage';

const pageTitles: Record<string, string> = {
  '/chat': 'Chat',
  '/docs': 'Documents',
  '/retrieval': 'Retrieval',
  '/system': 'System Monitoring',
};

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] ?? 'AutoCare Copilot';

  return (
    <div className="app-root">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <SideNav open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-wrapper">
        <TopNav title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Navigate to="/system" replace />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/retrieval" element={<RetrievalPage />} />
            <Route path="/system" element={<SystemPage />} />
          </Routes>
        </main>
      </div>

      {/* 서비스 동작 로그 FAB — 라우팅 외부, 항상 표시 */}
      <ServiceLogFab />
    </div>
  );
}
