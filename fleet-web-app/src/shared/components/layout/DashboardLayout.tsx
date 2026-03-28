import { useState, memo } from 'react';
import { Outlet } from 'react-router-dom';
import {Header} from './Header/Header';

export const DashboardLayout = memo(() => {
  const [dark, setDark] = useState(false);

  return (
    <div className={`flex h-screen ${dark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header dark={dark} setDark={setDark} />

        <main className={`flex-1 overflow-y-auto p-6 transition-colors ${dark ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
          <Outlet context={{ dark, setDark }} />
        </main>
      </div>
    </div>
  );
});

