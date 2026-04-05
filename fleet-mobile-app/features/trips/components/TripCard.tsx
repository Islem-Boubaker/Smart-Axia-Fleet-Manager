import { View, Text, TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { STATUS_CONFIG } from "../config/trips.config";
import type { Trip } from "../types/trip.types";

interface Props {
  trip: Trip;
  onPress: () => void;
}

export function TripCard({ trip, onPress }: Props) {
  // ✅ Guard — if trip is undefined/null, render nothing
  if (!trip) return null;

  // ✅ Safe fallback — never call Object.keys(undefined)
  const status = trip.status ?? "pending";
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  return (
    <TouchableOpacity
      className="bg-white rounded-[18px] mb-3 overflow-hidden"
      style={{
        elevation: 1,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      }}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Colour accent bar */}
      <View style={{ height: 4, backgroundColor: cfg.accentColor }} />

      {/* Card body */}
      <View className="px-4 pt-3.5 pb-3">

        {/* Top row: vehicle + badge */}
        <View className="flex-row items-start justify-between mb-2.5">
          <View className="flex-1 mr-2">
            <Text className="text-[15px] font-bold text-slate-900" numberOfLines={1}>
              {trip.vehicle || "—"}
            </Text>
            <Text className="text-[11px] text-gray-400 mt-0.5">
              # {trip.tripNumber || "—"}
            </Text>
          </View>
          <View
            className="px-2.5 py-1 rounded-full"
            style={{ backgroundColor: cfg.badgeBg }}
          >
            <Text
              className="text-[10px] font-bold uppercase tracking-wide"
              style={{ color: cfg.badgeText }}
            >
              {cfg.label}
            </Text>
          </View>
        </View>

        {/* Route: from → to */}
        <View className="flex-row items-center gap-2 mb-3">
          <View
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: cfg.accentColor }}
          />
          <Text
            className="text-xs font-medium text-slate-700"
            numberOfLines={1}
            style={{ flex: 1 }}
          >
            {trip.from || "—"}
          </Text>

          <View className="flex-row items-center" style={{ width: 40 }}>
            <View style={{ flex: 1, borderTopWidth: 1, borderStyle: "dashed", borderColor: "#E5E7EB" }} />
            <MaterialIcons name="arrow-forward" size={10} color="#9CA3AF" />
          </View>

          <Text
            className="text-xs font-medium text-slate-700 text-right"
            numberOfLines={1}
            style={{ flex: 1 }}
          >
            {trip.to || "—"}
          </Text>
          <View className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
        </View>

        {/* Meta: distance + duration + score */}
        <View className="flex-row gap-4">
          {!!trip.distance && (
            <View className="flex-row items-center gap-1.5">
              <MaterialIcons name="straighten" size={13} color="#9CA3AF" />
              <Text className="text-[11px] text-gray-500 font-medium">
                {trip.distance}
              </Text>
            </View>
          )}
          {!!trip.duration && (
            <View className="flex-row items-center gap-1.5">
              <MaterialIcons name="schedule" size={13} color="#9CA3AF" />
              <Text className="text-[11px] text-gray-500 font-medium">
                {trip.duration}
              </Text>
            </View>
          )}
          {trip.score != null && (
            <View className="flex-row items-center gap-1.5">
              <MaterialIcons name="star" size={13} color="#F59E0B" />
              <Text className="text-[11px] font-bold text-amber-600">
                {trip.score}%
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Card footer */}
      <View className="flex-row items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50">
        <View className="flex-row items-center gap-1.5">
          <MaterialIcons name="calendar-today" size={11} color="#9CA3AF" />
          <Text className="text-[11px] text-gray-400">
            {trip.date || "—"}
          </Text>
        </View>
        <Text className="text-[11px] font-bold text-emerald-600">
          View details ›
        </Text>
      </View>
    </TouchableOpacity>
  );
}

TripCard.displayName = "TripCard";