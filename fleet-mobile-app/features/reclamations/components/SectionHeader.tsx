import { View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";

export default function SectionHeader({ onViewAll }: any) {
  const { t } = useTranslation();

  return (
    <View className="flex-row justify-between items-center px-5 mb-2">
      <Text className="text-sm font-bold text-gray-700 dark:text-slate-200">
        {t("reclamations.recent")}
      </Text>

      <TouchableOpacity onPress={onViewAll}>
        <Text className="text-xs text-emerald-600 font-semibold">
          {t("reclamations.viewAll")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
