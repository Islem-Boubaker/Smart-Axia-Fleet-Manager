import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface SummaryCardProps {
  icon: string;
  title: string;
  value: string | number;
  backgroundColor?: string;
  iconColor?: string;
  onPress?: () => void;
}

export function SummaryCard({
  icon,
  title,
  value,
  backgroundColor = "#DBEAFE",
  iconColor = "#2563EB",
  onPress,
}: SummaryCardProps) {
  return (
    <TouchableOpacity
      className="rounded-xl p-4 flex-row items-center my-2 shadow-sm"
      style={{ backgroundColor }}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View className="w-12 h-12 rounded-xl bg-white/50 items-center justify-center mr-4">
        <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
      </View>

      <View className="flex-1">
        <Text className="text-xs text-gray-500 font-medium mb-1">
          {title}
        </Text>

        <Text className="text-xl font-bold text-gray-900">
          {value}
        </Text>
      </View>
    </TouchableOpacity>
  );
}