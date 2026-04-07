import { useState, memo, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AppTopBar } from './Header/AppTopBar';
import { Sidebar } from './Sidebar';

export const DashboardLayout = memo(() => {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          className={`flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-8 lg:px-12 py-6 lg:py-10 transition-colors ${
            dark ? 'text-slate-100' : 'text-slate-900'
          }`}
        >
          <div className="max-w-[1440px] mx-auto w-full">
            <Outlet context={{ dark, setDark }} />
          </div>
        </main>
      </div>
    </div>
  );
});

