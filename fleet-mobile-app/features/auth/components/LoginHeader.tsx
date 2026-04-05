import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export function LoginHeader() {
  return (
    <View className="items-center mt-10 mb-12">

      <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center mb-6">
        <MaterialCommunityIcons
          name="truck-fast"
          size={48}
          color="#2563EB"
        />
      </View>

      <Text className="text-[28px] font-bold text-gray-900 tracking-wide">
        SMART AXIA
      </Text>

      <Text className="text-base font-semibold text-blue-600 mt-2">
        Fleet Manager
      </Text>

      <Text className="text-xs text-gray-500 mt-1">
        Driver Mobile Application
      </Text>

    </View>
  );
}