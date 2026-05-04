import { useState, memo, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppTopBar } from './Header/AppTopBar';
import { Sidebar } from './Sidebar';
import { ROUTES } from '../../../utils/constants';

export const DashboardLayout = memo(() => {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isReportsPage = location.pathname === ROUTES.REPORTS;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div
      className={`flex h-screen min-h-0 font-sans transition-colors ${
        dark
          ? 'bg-slate-950 text-slate-100'
          : 'bg-gradient-to-br from-canvas via-brand-light/40 to-slate-100 text-slate-900'
      }`}
    >
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} dark={dark} />

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <AppTopBar dark={dark} setDark={setDark} onMenuClick={() => setSidebarOpen(true)} />

        <main
          className={`flex-1 transition-colors ${
            isReportsPage
              ? 'min-h-0 overflow-hidden p-0'
              : 'overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-8 lg:px-12 lg:py-10'
          } ${dark ? 'text-slate-100' : 'text-slate-900'}`}
        >
          <div className={isReportsPage ? 'h-full w-full' : 'mx-auto w-full max-w-[1440px]'}>
            <Outlet context={{ dark, setDark }} />
          </div>
        </main>
      </div>
    </div>
  );
});

