import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { I18nManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import fr from "./locales/fr.json";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

const LANGUAGE_KEY = "fleet.app.language";

export const SUPPORTED_LANGUAGES = [
  { code: "fr", label: "Français",  native: "Français"  },
  { code: "en", label: "English",   native: "English"   },
  { code: "ar", label: "Arabic",    native: "العربية"   },
] as const;

export type SupportedLang = (typeof SUPPORTED_LANGUAGES)[number]["code"];

const loadStoredLanguage = async (): Promise<SupportedLang> => {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored === "fr" || stored === "en" || stored === "ar") return stored;
  } catch {
    // ignore
  }
  return "fr";
};

export const changeAppLanguage = async (lang: SupportedLang): Promise<void> => {
  await i18next.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch {
    // ignore
  }
  const isRTL = lang === "ar";
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
  }
};

const initI18n = async () => {
  const lng = await loadStoredLanguage();

  await i18next.use(initReactI18next).init({
    lng,
    fallbackLng: "fr",
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      ar: { translation: ar },
    },
    interpolation: { escapeValue: false },
    compatibilityJSON: "v4",
  });

  const isRTL = lng === "ar";
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
  }
};

void initI18n();

export default i18next;
