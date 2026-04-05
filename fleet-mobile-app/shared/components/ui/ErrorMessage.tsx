import React from "react";
import { View, Text } from "react-native";

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <View className="bg-red-100 rounded-lg p-4 mb-4">
      <Text className="text-red-600 text-[13px] font-medium">
        {message}
      </Text>
    </View>
  );
}