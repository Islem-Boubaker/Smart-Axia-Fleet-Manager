import { View, Text, TouchableOpacity } from "react-native";
import type { Trip } from "../types/driver.types";

interface TaskCardProps {
  trip: Trip | null;
  isCurrent: boolean;
  onPress?: () => void;
}

const formatTaskTime = (trip: Trip | null): string => {
  if (!trip?.startTime) return "No schedule";
  return new Date(trip.startTime).toLocaleString();
};

const formatVehicleLabel = (trip: Trip | null): string => {
  if (!trip) return "No task assigned";
  return `${trip.startLocation} -> ${trip.endLocation}`;
};

export default function TaskCard({ trip, isCurrent, onPress }: TaskCardProps) {
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
        {isCurrent ? "CURRENT TASK" : "UPCOMING TASK"}
      </Text>

      <Text
        className={`text-lg font-bold ${
          isCurrent ? "text-white" : "text-gray-900 dark:text-gray-50"
        }`}
      >
        {formatVehicleLabel(trip)}
      </Text>

      <Text
        className={`text-xs mb-3 ${
          isCurrent ? "text-white/70" : "text-gray-400 dark:text-slate-400"
        }`}
      >
        {formatTaskTime(trip)}
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
          Task details
        </Text>
      </View>
    </TouchableOpacity>
  );
}