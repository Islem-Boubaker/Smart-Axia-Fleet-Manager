import React from "react";
import { ActivityIndicator, View } from "react-native";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
}

export function LoadingSpinner({ fullScreen = false }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return <ActivityIndicator size="large" color="#3B82F6" />;
}