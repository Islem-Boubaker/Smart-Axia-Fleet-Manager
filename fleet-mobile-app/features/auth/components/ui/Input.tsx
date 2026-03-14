import React from "react";
import { View, TextInput, TouchableOpacity, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type InputProps = {
  value: string;
  onChangeText: (value: string) => void;
  editable?: boolean;
  showPassword: boolean;
  onToggleVisibility: () => void;
};

export function Input({
  value,
  onChangeText,
  editable = true,
  showPassword,
  onToggleVisibility,
}: InputProps) {
  return (
    <View className="mb-6">
      
      <Text className="text-sm font-semibold text-gray-900 mb-2">
        Password
      </Text>

      <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-4">

        <MaterialCommunityIcons
          name="lock"
          size={20}
          color="#9CA3AF"
          style={{ marginRight: 8 }}
        />

        <TextInput
          className="flex-1 py-3 text-[15px] text-gray-900"
          placeholder="Enter your password"
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          secureTextEntry={!showPassword}
        />

        <TouchableOpacity
          onPress={onToggleVisibility}
          className="p-2"
        >
          <MaterialCommunityIcons
            name={showPassword ? "eye-off" : "eye"}
            size={20}
            color="#9CA3AF"
          />
        </TouchableOpacity>

      </View>

    </View>
  );
}