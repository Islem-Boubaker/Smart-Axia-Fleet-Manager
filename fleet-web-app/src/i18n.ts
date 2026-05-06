import i18n, { type Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

type LocaleModule = { default: Record<string, unknown> };

const localeModules = import.meta.glob('./locales/*/*.json', {
  eager: true,
}) as Record<string, LocaleModule>;

const resources: Resource = {};

for (const [path, module] of Object.entries(localeModules)) {
  const match = path.match(/\.\/locales\/([^/]+)\/[^/]+\.json$/);
  if (!match) continue;

  const lng = match[1];
  resources[lng] = resources[lng] ?? { translation: {} };
  resources[lng].translation = {
    ...(resources[lng].translation as Record<string, unknown>),
    ...module.default,
  };
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'translation',
    supportedLngs: ['en', 'fr', 'ar'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18n;
