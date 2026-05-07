import React, { useState } from "react";
import { I18nManager, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { InputField } from "../components/ui/InputField";
import { FormCard } from "../components/ui/FormCard";
import { SubmitButton } from "../components/ui/SubmitButton";
import { useAppTheme } from "@/shared/theme/ThemeProvider";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { t } = useTranslation();

  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA] dark:bg-[#0B1220]">
      {/* Header */}
      <View className="flex-row items-center mt-10 px-4 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          {I18nManager.isRTL ? (
            <ChevronRight size={22} color={isDark ? "#F8FAFC" : "#111827"} />
          ) : (
            <ChevronLeft size={22} color={isDark ? "#F8FAFC" : "#111827"} />
          )}
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-gray-900 dark:text-gray-50">
          {t("profile.changePassword")}
        </Text>
      </View>

      <FormCard>
        <InputField
          label={t("profile.password.current")}
          value={current}
          onChangeText={setCurrent}
          secureTextEntry
        />
        <InputField
          label={t("profile.password.new")}
          value={newPwd}
          onChangeText={setNewPwd}
          secureTextEntry
        />
        <InputField
          label={t("profile.password.confirm")}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />
      </FormCard>

      <SubmitButton
        label={t("profile.password.update")}
        onPress={() => console.log("update")}
      />
    </SafeAreaView>
  );
}
