import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

export function FooterLink() {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center">
      <Text className="text-sm text-gray-500">
        {t("auth.rememberPassword")}
      </Text>

      <TouchableOpacity onPress={() => router.back()}>
        <Text className="text-sm text-blue-700 font-medium">
          {t("auth.login.submit")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
