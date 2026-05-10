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
      { code: 'en', label: 'English',  shortLabel: 'EN', dir: 'ltr' as const },
      { code: 'fr', label: 'Français', shortLabel: 'FR', dir: 'ltr' as const },
      { code: 'ar', label: 'العربية',  shortLabel: 'AR', dir: 'rtl' as const },
    ],
    [],
  );

  const value = normalizeLang(i18n.language);

  // ── Responsive dropdown position ─────────────────────────────────────────
  // Default: right-align the dropdown (extends leftward from the trigger).
  // Flip to left-align only when that would clip the left edge of the viewport.
  // NOTE: left/right in CSS absolute positioning are always physical (not affected
  // by dir="rtl"), so no special RTL branch is needed here.
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!open || !containerRef.current) return;

    const DROPDOWN_WIDTH = 190;
    const MARGIN = 8;
    const rect = containerRef.current.getBoundingClientRect();

    // Right-aligned: dropdown's right edge = trigger's right edge → extends left.
    // Falls back to left-aligned when that would overflow the left edge.
    const wouldOverflowLeft = rect.right - DROPDOWN_WIDTH < MARGIN;
    setDropdownStyle(
      wouldOverflowLeft
        ? { left: 0, right: 'auto' }
        : { right: 0, left: 'auto' },
    );
  }, [open]);

  // ── Outside-click + Escape ────────────────────────────────────────────────
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
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
      {/* Trigger button */}
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

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          style={dropdownStyle}
          className={`
            absolute top-[calc(100%+0.5rem)] z-[140]
            w-[190px] max-w-[calc(100vw-16px)]
            overflow-hidden rounded-2xl border shadow-2xl
            ${
              dark
                ? 'border-slate-600 bg-[#0b1625] text-slate-50 ring-1 ring-slate-500/35'
                : 'border-slate-200 bg-white text-slate-900'
            }
          `}
        >
          {/* Header */}
          <div
            className={`px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] ${
              dark ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            {t('header.language')}
          </div>

          {/* Options */}
          <div className={`border-t p-1.5 ${dark ? 'border-slate-600' : 'border-slate-200'}`}>
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
                        ? 'bg-sky-500/20 text-white'
                        : 'bg-sky-50 text-sky-700'
                      : dark
                        ? 'text-slate-100 hover:bg-slate-800'
                        : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                        dark
                          ? 'bg-slate-800 text-slate-100 ring-1 ring-slate-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {lang.shortLabel}
                    </span>
                    <span>{lang.label}</span>
                  </span>
                  {isActive && <FiCheck className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

LanguageSelector.displayName = 'LanguageSelector';