import { View, Text, TouchableOpacity, Animated } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { TripRoute } from "../types/maps.types";

interface Props {
  trip: TripRoute;
  sheetHeight: Animated.AnimatedInterpolation<number>;
  completedStops: number;
  totalStops: number;
  onToggle: () => void;
}

export function TripBottomSheet({
  trip,
  sheetHeight,
  completedStops,
  totalStops,
  onToggle,
}: Props) {
  const progressPct = (completedStops / totalStops) * 100;

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: 0, right: 0, bottom: 0,
        height: sheetHeight,
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        elevation: 12,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Drag handle */}
      <TouchableOpacity
        className="items-center pt-3 pb-1"
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View className="w-10 h-1 rounded-full bg-gray-200" />
      </TouchableOpacity>

      {/* Destination + distance + duration */}
      <View className="flex-row items-center px-5 py-3 gap-4 border-b border-gray-100">
        <View className="flex-1">
          <Text className="text-[11px] text-gray-400 font-medium mb-0.5">
            DESTINATION
          </Text>
          <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
            {trip.destination.label}
          </Text>
        </View>
        <View className="flex-row gap-4">
          <View className="items-center">
            <MaterialIcons name="straighten" size={14} color="#9CA3AF" />
            <Text className="text-xs font-bold text-slate-900 mt-0.5">
              {trip.distance}
            </Text>
          </View>
          <View className="items-center">
            <MaterialIcons name="schedule" size={14} color="#9CA3AF" />
            <Text className="text-xs font-bold text-slate-900 mt-0.5">
              {trip.duration}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress bar + stop list */}
      <View className="px-5 pt-3">
        {/* Progress header */}
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-[11px] text-gray-400 font-medium">PROGRESS</Text>
          <Text className="text-[11px] font-bold text-emerald-600">
            {completedStops}/{totalStops} stops
          </Text>
        </View>

        {/* Progress bar */}
        <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
          <View
            className="h-full bg-emerald-500 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </View>

        {/* Origin */}
        <View className="flex-row items-center gap-3">
          <View className="items-center">
            <View className="w-3 h-3 rounded-full bg-emerald-500" />
            <View className="w-0.5 h-6 bg-gray-200" />
          </View>
          <Text
            className="text-xs text-emerald-600 font-semibold flex-1"
            numberOfLines={1}
          >
            {trip.origin.label}
          </Text>
        </View>

        {/* Waypoints */}
        {trip.waypoints.map((wp, i) => (
          <View key={wp.id} className="flex-row items-center gap-3">
            <View className="items-center">
              <View
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: wp.reached ? "#2D9B6F" : "#D1D5DB" }}
              />
              {i < trip.waypoints.length - 1 && (
                <View className="w-0.5 h-6 bg-gray-200" />
              )}
            </View>
            <Text
              className={`text-xs font-semibold flex-1 ${
                wp.reached ? "text-emerald-600" : "text-gray-400"
              }`}
              numberOfLines={1}
            >
              {wp.label}
            </Text>
            {!wp.reached && (
              <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                <Text className="text-[9px] text-gray-500 font-semibold">
                  NEXT
                </Text>
              </View>
            )}
          </View>
        ))}

        {/* Destination */}
        <View className="flex-row items-center gap-3 mt-1">
          <View
            className="w-3 h-3 rounded-full border-2"
            style={{ borderColor: "#EF4444" }}
          />
          <Text
            className="text-xs text-red-500 font-semibold flex-1"
            numberOfLines={1}
          >
            {trip.destination.label}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

TripBottomSheet.displayName = "TripBottomSheet";