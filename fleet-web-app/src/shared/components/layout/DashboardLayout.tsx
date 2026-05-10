import { useState, memo, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppTopBar } from './Header/AppTopBar';
import { Sidebar } from './Sidebar';
import { ROUTES } from '../../../utils/constants';

export const DashboardLayout = memo(() => {
  const { i18n } = useTranslation();
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const location = useLocation();
  const isReportsPage = location.pathname === ROUTES.REPORTS;
  const isRtl = (i18n.language || 'en').split('-')[0] === 'ar';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div
      className={`relative flex h-screen min-h-0 overflow-hidden font-sans transition-colors ${
        dark
          ? 'bg-[radial-gradient(circle_at_12%_0%,#123A5A_0%,#081321_38%,#050A12_100%)] text-slate-100'
          : 'bg-[radial-gradient(circle_at_top_left,#bfefff_0%,#e9f8fb_36%,#35a8db_100%)] text-slate-900'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${
          dark
            ? 'bg-[radial-gradient(circle_at_82%_12%,rgba(45,212,191,0.13),transparent_30%),radial-gradient(circle_at_20%_90%,rgba(59,130,246,0.13),transparent_34%),linear-gradient(120deg,rgba(14,165,233,0.08),transparent_42%)]'
            : 'bg-[linear-gradient(120deg,rgba(255,255,255,0.40),transparent_34%,rgba(255,255,255,0.18))]'
        }`}
      />
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        expanded={sidebarExpanded}
        setExpanded={setSidebarExpanded}
        dark={dark}
      />

      <div
        className="relative z-10 flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden p-2 sm:p-3"
      >
        <AppTopBar dark={dark} setDark={setDark} onMenuClick={() => setSidebarOpen(true)} />

        <main
          className={`flex-1 transition-colors ${
            isReportsPage
              ? 'min-h-0 overflow-hidden p-0'
              : 'overflow-y-auto overflow-x-hidden px-1 pb-2 sm:px-2'
          } ${dark ? 'text-slate-100' : 'text-slate-900'}`}
        >
          <div className={isReportsPage ? 'h-full w-full' : 'w-full'}>
            <Outlet context={{ dark, setDark }} />
          </div>
        </main>
      </div>
    </div>
  );
});

