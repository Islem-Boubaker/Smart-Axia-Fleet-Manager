import { View, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";
import type { FilterOption } from "../config/trips.config";

interface Props {
  filter: FilterOption;
}

export function TripEmptyState({ filter }: Props) {
  const { t } = useTranslation();
  const label = filter !== "all" ? t(`trips.filters.${filter}`) : "";

  return (
    <View className="items-center justify-center py-16">
      <MaterialIcons name="directions-car" size={52} color="#E5E7EB" />
      <Text className="text-sm font-semibold text-gray-400 dark:text-slate-400 mt-4">
        {t("trips.noTripsFound", { label })}
      </Text>
      <Text className="text-xs text-gray-300 dark:text-slate-500 mt-1">
        {t("trips.pullToRefresh")}
      </Text>
    </View>
  );
}

TripEmptyState.displayName = "TripEmptyState";
