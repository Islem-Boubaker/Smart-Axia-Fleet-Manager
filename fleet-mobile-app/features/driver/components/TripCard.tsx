import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { getStatusTranslationKey } from "@/shared/utils/translateStatus";
import type { Trip } from "../types/driver.types";

const STATUS_CONFIG: Record<Trip["status"], { badge: string; text: string }> = {
  completed: {
    badge: "bg-emerald-50",
    text: "text-emerald-700",
  },
  scheduled: {
    badge: "bg-orange-50",
    text: "text-orange-600",
  },
  ongoing: {
    badge: "bg-blue-50",
    text: "text-blue-700",
  },
  cancelled: {
    badge: "bg-gray-100",
    text: "text-gray-600",
  },
};

interface TripCardProps {
  trip: Trip;
}

const formatStartTime = (value?: string): string => {
  if (!value) return "";
  return new Date(value).toLocaleString();
};

export default function TripCard({ trip }: TripCardProps) {
  const { t } = useTranslation();
  const st = STATUS_CONFIG[trip.status];
  const startTimeLabel = formatStartTime(trip.startTime) || t("trips.noStartTime");

  const meta = [
    { icon: "place", value: `${trip.distance ?? 0} km` },
    { icon: "alt-route", value: t("trips.stopsWithCount", { count: trip.stops?.length ?? 0 }) },
    { icon: "schedule", value: startTimeLabel },
  ];

  return (
    <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 dark:border-slate-700">
      <View className="flex-1">
        <Text className="font-bold text-gray-900 dark:text-gray-50">{trip.startLocation} {"->"} {trip.endLocation}</Text>

        <View className="flex-row items-center gap-1 mb-2">
          <MaterialIcons name="schedule" size={14} color="#9CA3AF" />
          <Text className="text-xs text-gray-400 dark:text-slate-400">{startTimeLabel}</Text>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {meta.map((m, i) => (
            <View key={i} className="flex-row items-center gap-1 w-[48%]">
              <MaterialIcons name={m.icon as never} size={14} color="#9CA3AF" />
              <Text className="text-xs text-gray-600 dark:text-slate-300">{m.value}</Text>
            </View>
          ))}
        </View>

        <View className="flex-row items-center mt-2 gap-2">
          <View className={`px-2 py-1 rounded-full ${st.badge}`}>
            <Text className={`text-[10px] font-bold ${st.text}`}>
              {t(getStatusTranslationKey(trip.status))}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
