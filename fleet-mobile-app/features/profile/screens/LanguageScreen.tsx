import React, { useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Check } from "lucide-react-native";
import { useRouter } from "expo-router";
import BackButton from "@/shared/components/ui/BackButton";

const languages = [
  { code: "en", label: "English",    native: "English"     },
  { code: "fr", label: "French",     native: "Français"    },
  { code: "ar", label: "Arabic",     native: "العربية"     },
  { code: "es", label: "Spanish",    native: "Español"     },
  { code: "de", label: "German",     native: "Deutsch"     },
  { code: "it", label: "Italian",    native: "Italiano"    },
  { code: "pt", label: "Portuguese", native: "Português"   },
  { code: "ru", label: "Russian",    native: "Русский"     },
  { code: "zh", label: "Chinese",    native: "中文"         },
  { code: "ja", label: "Japanese",   native: "日本語"       },
  { code: "ko", label: "Korean",     native: "한국어"       },
  { code: "tr", label: "Turkish",    native: "Türkçe"      },
  { code: "nl", label: "Dutch",      native: "Nederlands"  },
  { code: "pl", label: "Polish",     native: "Polski"      },
  { code: "sv", label: "Swedish",    native: "Svenska"     },
];

export default function LanguageScreen() {
  const router   = useRouter();
  const [selected, setSelected] = useState("en");

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA]">

      <View className="flex-row items-center px-4 pb-4" style={{ paddingTop: Platform.OS === "ios" ? 8 : 0 }}>
       <BackButton/>
        <Text className="flex-1 text-center text-lg font-bold text-gray-900">
          Language
        </Text>
      </View>

      <ScrollView
        className="mx-4 mt-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {languages.map((lang, i) => {
            const isSelected = selected === lang.code;
            const isLast     = i === languages.length - 1;

            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => setSelected(lang.code)}
                className={`flex-row justify-between items-center px-4 py-4 ${
                  isLast ? "" : "border-b border-gray-100"
                } ${isSelected ? "bg-blue-50" : ""}`}
              >
                <View>
                  <Text className={`text-base ${isSelected ? "font-semibold text-blue-700" : "text-gray-900"}`}>
                    {lang.label}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-0.5">
                    {lang.native}
                  </Text>
                </View>

                {isSelected && <Check size={18} color="#10b981" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}