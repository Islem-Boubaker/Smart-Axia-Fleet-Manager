import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const normalizeLang = (code: string) => code.split('-')[0] ?? 'en';

export const LanguageSelector = memo(({ dark = false }: { dark?: boolean }) => {
  const { i18n, t } = useTranslation();

  const languages = useMemo(
    () => [
      { code: 'en', label: 'EN', dir: 'ltr' as const },
      { code: 'fr', label: 'FR', dir: 'ltr' as const },
      { code: 'ar', label: 'AR', dir: 'rtl' as const },
    ],
    [],
  );

  const value = normalizeLang(i18n.language);

  const changeLanguage = (code: string, dir: 'ltr' | 'rtl') => {
    void i18n.changeLanguage(code);
    document.documentElement.lang = code;
    document.documentElement.dir = dir;
    localStorage.setItem('i18nextLng', code);
  };

  return (
    <select
      aria-label={t('header.language')}
      value={languages.some((l) => l.code === value) ? value : 'en'}
      onChange={(e) => {
        const lang = languages.find((l) => l.code === e.target.value);
        if (lang) changeLanguage(lang.code, lang.dir);
      }}
      className={`text-sm rounded-xl border px-2 py-1.5 outline-none transition-colors ${
        dark
          ? 'border-slate-600/80 bg-slate-800/80 text-slate-100'
          : 'border-slate-200/90 bg-white/90 text-slate-800'
      }`}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
});

LanguageSelector.displayName = 'LanguageSelector';
