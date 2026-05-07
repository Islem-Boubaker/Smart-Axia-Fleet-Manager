import { View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import type { Trip } from "../types/driver.types";

interface TaskCardProps {
  trip: Trip | null;
  isCurrent: boolean;
  onPress?: () => void;
}

const formatTaskTime = (trip: Trip | null): string => {
  if (!trip?.startTime) return "";
  return new Date(trip.startTime).toLocaleString();
};

const formatVehicleLabel = (trip: Trip | null): string => {
  if (!trip) return "";
  return `${trip.startLocation} -> ${trip.endLocation}`;
};

export default function TaskCard({ trip, isCurrent, onPress }: TaskCardProps) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      className={`flex-1 rounded-2xl p-4 ${
        isCurrent ? "bg-blue-500" : "bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700"
      }`}
      onPress={onPress}
      disabled={!trip}
    >
      <Text
        className={`text-[9px] font-bold mb-1 ${
          isCurrent ? "text-white/70" : "text-blue-500"
        }`}
      >
        {isCurrent ? t("home.currentTask") : t("home.upcomingTask")}
      </Text>

      <Text
        className={`text-lg font-bold ${
          isCurrent ? "text-white" : "text-gray-900 dark:text-gray-50"
        }`}
      >
        {trip ? formatVehicleLabel(trip) : t("home.noTaskAssigned")}
      </Text>

      <Text
        className={`text-xs mb-3 ${
          isCurrent ? "text-white/70" : "text-gray-400 dark:text-slate-400"
        }`}
      >
        {formatTaskTime(trip) || t("home.noSchedule")}
      </Text>

      <View
        className={`rounded-lg py-2 items-center ${
          isCurrent ? "bg-white/20" : "bg-gray-100 dark:bg-slate-800"
        }`}
      >
        <Text
          className={`text-xs font-semibold ${
            isCurrent ? "text-white" : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {t("home.taskDetails")}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
