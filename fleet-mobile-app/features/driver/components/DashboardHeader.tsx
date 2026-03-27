import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type DashboardHeaderProps = {
  userName?: string;
};

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <View className="flex-row justify-between items-center mb-10">
      <View>
        <Text className="text-[22px] font-bold text-gray-900 mb-2">
          Welcome back, {userName || "Driver"}!
        </Text>

        <Text className="text-[13px] text-gray-500">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </Text>
      </View>

      <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center">
        <MaterialCommunityIcons
          name="account-circle"
          size={40}
          color="#2563EB"
        />
      </View>
    </View>
  );
}