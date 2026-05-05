import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { FiGlobe, FiCheck } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const normalizeLang = (code: string) => code.split('-')[0] ?? 'en';

export const LanguageSelector = memo(({ dark = false }: { dark?: boolean }) => {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isRtl = normalizeLang(i18n.language) === 'ar';

  const languages = useMemo(
    () => [
      { code: 'en', label: 'English', shortLabel: 'EN', dir: 'ltr' as const },
      { code: 'fr', label: 'Français', shortLabel: 'FR', dir: 'ltr' as const },
      { code: 'ar', label: 'العربية', shortLabel: 'AR', dir: 'rtl' as const },
    ],
    [],
  );

  const value = normalizeLang(i18n.language);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const changeLanguage = (code: string, dir: 'ltr' | 'rtl') => {
    void i18n.changeLanguage(code);
    document.documentElement.lang = code;
    document.documentElement.dir = dir;
    localStorage.setItem('i18nextLng', code);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label={t('header.language')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
          dark
            ? 'border-cyan-200/10 bg-[#081220]/90 text-slate-200 hover:bg-slate-800'
            : 'border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-50'
        }`}
        title={t('header.language')}
      >
        <FiGlobe className="h-4.5 w-4.5" />
      </button>

      {open ? (
        <div
          role="menu"
          className={`absolute ${isRtl ? 'left-0' : 'right-0'} top-[calc(100%+0.5rem)] z-50 min-w-[160px] overflow-hidden rounded-2xl border shadow-xl ${
            dark
              ? 'border-cyan-200/10 bg-[#0F1B2D]/96 text-slate-100'
              : 'border-slate-200 bg-white text-slate-900'
          }`}
        >
          <div className={`px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] ${
            dark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {t('header.language')}
          </div>
          <div className="p-1.5">
            {languages.map((lang) => {
              const isActive = lang.code === value;

              return (
                <button
                  key={lang.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => changeLanguage(lang.code, lang.dir)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? dark
                        ? 'bg-cyan-300/12 text-cyan-100'
                        : 'bg-sky-50 text-sky-700'
                      : dark
                        ? 'text-slate-200 hover:bg-slate-800'
                        : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                      dark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {lang.shortLabel}
                    </span>
                    <span>{lang.label}</span>
                  </span>
                  {isActive ? <FiCheck className="h-4 w-4" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
});

LanguageSelector.displayName = 'LanguageSelector';
