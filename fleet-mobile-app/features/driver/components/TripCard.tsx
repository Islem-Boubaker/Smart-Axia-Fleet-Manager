import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { Trip } from "../types/driver.types";

const STATUS_CONFIG: Record<Trip["status"], { label: string; badge: string; text: string }> = {
  completed: {
    label: "COMPLETED",
    badge: "bg-emerald-50",
    text: "text-emerald-700",
  },
  scheduled: {
    label: "SCHEDULED",
    badge: "bg-orange-50",
    text: "text-orange-600",
  },
  ongoing: {
    label: "ONGOING",
    badge: "bg-blue-50",
    text: "text-blue-700",
  },
  cancelled: {
    label: "CANCELLED",
    badge: "bg-gray-100",
    text: "text-gray-600",
  },
};

interface TripCardProps {
  trip: Trip;
}

const formatStartTime = (value?: string): string => {
  if (!value) return "No start time";
  return new Date(value).toLocaleString();
};

export default function TripCard({ trip }: TripCardProps) {
  const st = STATUS_CONFIG[trip.status];

  const meta = [
    { icon: "place", value: `${trip.distance ?? 0} km` },
    { icon: "alt-route", value: `${trip.stops?.length ?? 0} stops` },
    { icon: "schedule", value: formatStartTime(trip.startTime) },
  ];

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
      <View className="flex-1">
        <Text className="font-bold text-gray-900">{trip.startLocation} {"->"} {trip.endLocation}</Text>

        <View className="flex-row items-center gap-1 mb-2">
          <MaterialIcons name="schedule" size={14} color="#9CA3AF" />
          <Text className="text-xs text-gray-400">{formatStartTime(trip.startTime)}</Text>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {meta.map((m, i) => (
            <View key={i} className="flex-row items-center gap-1 w-[48%]">
              <MaterialIcons name={m.icon as never} size={14} color="#9CA3AF" />
              <Text className="text-xs text-gray-600">{m.value}</Text>
            </View>
          ))}
        </View>

        <View className="flex-row items-center mt-2 gap-2">
          <View className={`px-2 py-1 rounded-full ${st.badge}`}>
            <Text className={`text-[10px] font-bold ${st.text}`}>
              {st.label}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}