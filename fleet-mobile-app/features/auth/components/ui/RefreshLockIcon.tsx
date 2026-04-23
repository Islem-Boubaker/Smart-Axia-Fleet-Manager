import React from "react";
import { View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const RefreshLockIcon = () => {
  return (
    <View className="items-center justify-center">
      {/* Outer glow ring */}
      <View className="w-24 h-24 rounded-3xl bg-blue-200/40 items-center justify-center">
        {/* Inner blue background */}
        <View className="w-20 h-20 rounded-2xl bg-blue-600 items-center justify-center">
          {/* Refresh icon as the base */}
          <MaterialIcons name="refresh" size={52} color="white" />

          {/* Lock icon overlaid in the center */}
          <View className="absolute">
            <MaterialIcons name="lock" size={20} color="white" />
          </View>
        </View>
      </View>
    </View>
  );
};

export default RefreshLockIcon;
