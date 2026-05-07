import React from "react";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";

export function LoginFooter() {
  const { t } = useTranslation();

  return (
    <View className="items-center mb-6">
      <Text className="text-xs text-gray-500 text-center">
        {t("auth.login.supportContact", { email: "support@smartaxia.com" })}
      </Text>
    </View>
  );
}
