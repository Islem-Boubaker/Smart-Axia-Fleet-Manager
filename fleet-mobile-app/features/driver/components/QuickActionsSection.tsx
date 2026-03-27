import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";


export function QuickActionsSection({navigation,}: any) {
  return (
    <View className="mb-10">

      <Text className="text-base font-bold text-gray-900 mb-4">
        Quick Actions
      </Text>
      <View className="flex-row justify-around gap-4">

        <TouchableOpacity
          className="flex-1 bg-white rounded-xl p-6 items-center shadow-sm"
          onPress={() => navigation.navigate("Trips")}
        >
          <MaterialCommunityIcons
            name="route-variant"
            size={28}
            color="#3B82F6"
          />
          <Text className="text-xs font-semibold text-gray-900 mt-2 text-center">
            View Trips
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-white rounded-xl p-6 items-center shadow-sm"
          onPress={() => navigation.navigate("Notifications")}
        >
          <MaterialCommunityIcons
            name="bell"
            size={28}
            color="#F59E0B"
          />
          <Text className="text-xs font-semibold text-gray-900 mt-2 text-center">
            Notifications
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-white rounded-xl p-6 items-center shadow-sm"
          onPress={() => navigation.navigate("Profile")}
        >
          <MaterialCommunityIcons
            name="account"
            size={28}
            color="#6366F1"
          />
          <Text className="text-xs font-semibold text-gray-900 mt-2 text-center">
            Profile
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}