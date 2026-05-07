import React from "react";
import { I18nManager, Text, View, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, Check } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "@/shared/theme/ThemeProvider";
import { SUPPORTED_LANGUAGES, changeAppLanguage, type SupportedLang } from "@/i18n";

export default function LanguageScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { t, i18n } = useTranslation();
  const selected = (i18n.language ?? "fr") as SupportedLang;

  const handleSelect = async (code: SupportedLang) => {
    await changeAppLanguage(code);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA] dark:bg-[#0B1220]">

      <View className="flex-row items-center mt-10 px-4 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          {I18nManager.isRTL ? (
            <ChevronRight size={22} color={isDark ? "#F8FAFC" : "#111827"} />
          ) : (
            <ChevronLeft size={22} color={isDark ? "#F8FAFC" : "#111827"} />
          )}
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-gray-900 dark:text-gray-50">
          {t("profile.language.title")}
        </Text>
      </View>

      <ScrollView
        className="mx-4 mt-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white border border-gray-200 rounded-2xl overflow-hidden dark:bg-slate-900 dark:border-slate-700">
          {SUPPORTED_LANGUAGES.map((lang, i) => {
            const isSelected = selected === lang.code;
            const isLast = i === SUPPORTED_LANGUAGES.length - 1;

            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => handleSelect(lang.code)}
                className={`flex-row justify-between items-center px-4 py-4 ${
                  isLast ? "" : "border-b border-gray-100 dark:border-slate-700"
                } ${isSelected ? "bg-emerald-50 dark:bg-emerald-500/10" : ""}`}
              >
                <View>
                  <Text className={`text-base ${isSelected ? "font-semibold text-emerald-700 dark:text-emerald-300" : "text-gray-900 dark:text-gray-100"}`}>
                    {t(`profile.language.${lang.code}`)}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-0.5 dark:text-slate-400">
                    {t(`profile.language.${lang.code}`)}
                  </Text>
                </View>

                {isSelected && <Check size={18} color={isDark ? "#6EE7B7" : "#10b981"} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}
