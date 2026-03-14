import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Trip } from "../../types";

interface TripCardProps {
  trip: Trip;
  onPress?: () => void;
}

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
      return "#22C55E";
    case "active":
      return "#3B82F6";
    case "pending":
      return "#F59E0B";
    case "cancelled":
      return "#EF4444";
    default:
      return "#9CA3AF";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return "check-circle";
    case "active":
      return "progress-clock";
    case "pending":
      return "clock-outline";
    case "cancelled":
      return "close-circle";
    default:
      return "help-circle";
  }
}

export function TripCard({ trip, onPress }: TripCardProps) {
  const statusColor = getStatusColor(trip.status);
  const statusIcon = getStatusIcon(trip.status);

  return (
    <TouchableOpacity
      className="bg-white rounded-xl p-4 my-2 shadow-sm"
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Header */}
      <View className="flex-row justify-between items-start mb-4">
        <View>
          <Text className="text-sm font-semibold text-gray-900">
            Trip #{trip.id}
          </Text>

          <Text className="text-xs text-gray-500 mt-1">
            {new Date(trip.scheduledTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        <View
          className="flex-row items-center px-2 py-1 rounded-md"
          style={{ backgroundColor: statusColor + "20" }}
        >
          <MaterialCommunityIcons
            name={statusIcon}
            size={16}
            color={statusColor}
          />

          <Text
            className="text-[11px] font-semibold capitalize ml-1"
            style={{ color: statusColor }}
          >
            {trip.status}
          </Text>
        </View>
      </View>

      {/* Locations */}
      <View className="my-4">

        <View className="flex-row items-start my-2">
          <MaterialCommunityIcons
            name="map-marker"
            size={18}
            color="#3B82F6"
          />

          <Text className="flex-1 text-[13px] text-gray-900 ml-3 leading-5">
            {trip.pickupLocation.address}
          </Text>
        </View>

        <View className="w-[2px] h-5 bg-gray-200 ml-2 my-1" />

        <View className="flex-row items-start my-2">
          <MaterialCommunityIcons
            name="map-marker-check"
            size={18}
            color="#22C55E"
          />

          <Text className="flex-1 text-[13px] text-gray-900 ml-3 leading-5">
            {trip.destinationLocation.address}
          </Text>
        </View>

      </View>

      {/* Footer */}
      {trip.distance && (
        <View className="flex-row justify-around border-t border-gray-100 pt-4">

          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons
              name="road"
              size={16}
              color="#6B7280"
            />
            <Text className="text-xs font-semibold text-gray-500">
              {trip.distance} km
            </Text>
          </View>

          {trip.fare && (
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons
                name="currency-usd"
                size={16}
                color="#6B7280"
              />
              <Text className="text-xs font-semibold text-gray-500">
                ${trip.fare}
              </Text>
            </View>
          )}

        </View>
      )}
    </TouchableOpacity>
  );
}