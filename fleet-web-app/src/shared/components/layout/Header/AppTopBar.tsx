import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMenu, FiMoon, FiSun } from 'react-icons/fi';
import { useAppSelector } from '../../../hooks';
import { LanguageSelector } from '../../LanguageSelector';
import UserMenu from '../../ui/UserMenu';
import { HeaderNotifications } from './HeaderNotifications';

export interface AppTopBarProps {
  dark: boolean;
  setDark: (dark: boolean) => void;
  onMenuClick?: () => void;
}

export const AppTopBar = memo(({ dark, setDark, onMenuClick }: AppTopBarProps) => {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const [now, setNow] = useState(() => new Date());
  const greeting = useMemo(() => {
    const hour = now.getHours();
    if (hour < 12) return t('header.goodMorning');
    if (hour < 18) return t('header.goodAfternoon');
    return t('header.goodEvening');
  }, [now, t]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header
      className={`shrink-0 z-20 pb-2 ${
        dark ? 'text-slate-100' : 'text-slate-900'
      }`}
    >
      <div
        className={`flex items-center gap-3 rounded-[28px] border px-4 py-3 shadow-glass backdrop-blur-xl transition-colors ${
          dark
            ? 'border-cyan-200/10 bg-[#0F1B2D]/92 shadow-[0_20px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)]'
            : 'border-white/90 bg-white/95'
        }`}
      >
        <button
          type="button"
          onClick={onMenuClick}
          className={`lg:hidden p-2.5 rounded-xl transition-colors ${
            dark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-600'
          }`}
          aria-label={t('header.openMenu')}
        >
          <FiMenu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className={`truncate text-2xl font-black tracking-tight ${dark ? 'text-slate-50' : 'text-slate-950'}`}>
            {t('header.greetingWithName', {
              greeting,
              name: user?.name?.split(' ')[0] || t('header.defaultName'),
            })}
          </h1>
          <p className={`hidden sm:block truncate text-sm font-bold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            {t('header.operationalActivity')}
          </p>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          <div
            className={`flex rounded-full p-0.5 border ${
              dark ? 'border-cyan-200/10 bg-[#081220]/90' : 'border-slate-200 bg-slate-100/80'
            }`}
          >
            <button
              type="button"
              onClick={() => setDark(false)}
              className={`p-2 rounded-full transition-all ${
                !dark ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
              title={t('header.lightMode')}
            >
              <FiSun className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDark(true)}
              className={`p-2 rounded-full transition-all ${
                dark ? 'bg-cyan-300/12 text-cyan-200 shadow-sm ring-1 ring-cyan-200/10' : 'text-slate-500 hover:text-slate-700'
              }`}
              title={t('header.darkMode')}
            >
              <FiMoon className="w-4 h-4" />
            </button>
          </div>

          <LanguageSelector dark={dark} />

          <HeaderNotifications />

          <div
            className={`pl-2 border-l ${dark ? 'border-cyan-200/10' : 'border-slate-200'} [&_button]:py-1.5 [&_button]:px-2`}
          >
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
});

AppTopBar.displayName = 'AppTopBar';
