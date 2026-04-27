import { memo } from 'react';
import { FiMenu, FiMoon, FiSearch, FiSun } from 'react-icons/fi';
import { HeaderNotifications } from './HeaderNotifications';
import UserMenu from '../../ui/UserMenu';

export interface AppTopBarProps {
  dark: boolean;
  setDark: (dark: boolean) => void;
  onMenuClick?: () => void;
}

export const AppTopBar = memo(({ dark, setDark, onMenuClick }: AppTopBarProps) => {
  return (
    <header
      className={`shrink-0 z-20  px-4 sm:px-6 lg:px-8 pt-4 pb-2 ${
        dark ? 'text-slate-100' : 'text-slate-900'
      }`}
    >
      <div
        className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 shadow-glass backdrop-blur-xl transition-colors ${
          dark
            ? 'border-slate-700/80 bg-slate-900/70'
            : 'border-slate-200/80 bg-white/70'
        }`}
      >
        <button
          type="button"
          onClick={onMenuClick}
          className={`lg:hidden p-2.5 rounded-xl transition-colors ${
            dark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-600'
          }`}
          aria-label="Open menu"
        >
          <FiMenu className="w-5 h-5" />
        </button>

        <div
          className={`hidden sm:flex flex-1 max-w-md items-center gap-2 rounded-xl px-3 py-2 border ${
            dark ? 'border-slate-600/60 bg-slate-800/50' : 'border-slate-200/80 bg-white/50'
          }`}
        >
          <FiSearch className={`shrink-0 w-4 h-4 ${dark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="search"
            name="search-query"
            autoComplete="off"
            placeholder="Search fleet, trips, drivers…"
            className={`w-full bg-transparent text-sm outline-none placeholder:text-slate-400 ${
              dark ? 'text-slate-100' : 'text-slate-800'
            }`}
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          <div
            className={`flex rounded-full p-0.5 border ${
              dark ? 'border-slate-600 bg-slate-800/80' : 'border-slate-200 bg-slate-100/80'
            }`}
          >
            <button
              type="button"
              onClick={() => setDark(false)}
              className={`p-2 rounded-full transition-all ${
                !dark ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Light mode"
            >
              <FiSun className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDark(true)}
              className={`p-2 rounded-full transition-all ${
                dark ? 'bg-slate-900 text-sky-300 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Dark mode"
            >
              <FiMoon className="w-4 h-4" />
            </button>
          </div>

          <HeaderNotifications />

          <div
            className={`pl-2 border-l ${dark ? 'border-slate-600' : 'border-slate-200'} [&_button]:py-1.5 [&_button]:px-2`}
          >
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
});

AppTopBar.displayName = 'AppTopBar';
