import { View } from "react-native";
import { useTranslation } from "react-i18next";
import StatCard from "./StatCard";

export default function ReclamationStats({ countOf }: any) {
  const { t } = useTranslation();

  return (
    <View className="flex-row gap-2.5 px-5 mt-2 mb-4">
      <StatCard count={countOf("pending")} label={t("status.pending")} dotColor="#F59E0B" />
      <StatCard count={countOf("in_progress")} label={t("status.inProgress")} dotColor="#3B82F6" />
      <StatCard count={countOf("resolved")} label={t("status.resolved")} dotColor="#10B981" />
    </View>
  );
}
