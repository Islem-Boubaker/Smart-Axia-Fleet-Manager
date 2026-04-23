import { View, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { FilterOption } from "../config/trips.config";

interface Props {
  filter: FilterOption;
}

export function TripEmptyState({ filter }: Props) {
  const label = filter !== "all" ? filter : "";

  return (
    <View className="items-center justify-center py-16">
      <MaterialIcons name="directions-car" size={52} color="#E5E7EB" />
      <Text className="text-sm font-semibold text-gray-400 dark:text-slate-400 mt-4">
        No {label} trips found
      </Text>
      <Text className="text-xs text-gray-300 dark:text-slate-500 mt-1">
        Pull down to refresh
      </Text>
    </View>
  );
}

TripEmptyState.displayName = "TripEmptyState";