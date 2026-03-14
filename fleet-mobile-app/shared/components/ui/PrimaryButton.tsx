import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle } from "react-native";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  style,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      className={`bg-blue-600 rounded-lg py-4 items-center justify-center ${
        isDisabled ? "opacity-50" : ""
      }`}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={style}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <Text className="text-white text-base font-semibold">
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}