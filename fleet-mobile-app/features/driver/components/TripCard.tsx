import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import ScoreBar from "./ScoreBar";

const STATUS_CONFIG = {
  completed: {
    label: "Completed",
    badge: "bg-emerald-50",
    text: "text-emerald-700",
  },
  pending: {
    label: "Pending",
    badge: "bg-orange-50",
    text: "text-orange-600",
  },
  active: {
    label: "Active",
    badge: "bg-blue-50",
    text: "text-blue-700",
  },
};

export default function TripCard({ trip }: any) {
  const st = STATUS_CONFIG[trip.status];

  const meta = [
    { icon: "confirmation-number", value: trip.tripNumber },
    { icon: "route", value: trip.routeCode },
    { icon: "place", value: trip.distance },
    { icon: "schedule", value: trip.duration },
  ];

  return (
    <View className="bg-white rounded-2xl p-4 flex-row mb-3 shadow-sm">
      <View className="flex-1">
        <Text className="font-bold text-gray-900">{trip.vehicle}</Text>

        <View className="flex-row items-center gap-1 mb-2">
          <MaterialIcons
            name={trip.timeUrgent ? "access-time" : "schedule"}
            size={14}
            color={trip.timeUrgent ? "red" : "#9CA3AF"}
          />
          <Text className="text-xs text-gray-400">
            {trip.timeUrgent || trip.date}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {meta.map((m, i) => (
            <View key={i} className="flex-row items-center gap-1 w-[45%]">
              <MaterialIcons name={m.icon} size={14} color="#9CA3AF" />
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

      <ScoreBar score={trip.score} status={trip.status} />
    </View>
  );
}