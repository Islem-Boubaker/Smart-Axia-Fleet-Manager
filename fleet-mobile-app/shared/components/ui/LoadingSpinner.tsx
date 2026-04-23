import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useAppTheme } from "@/shared/theme/ThemeProvider";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
}

export function LoadingSpinner({ fullScreen = false }: LoadingSpinnerProps) {
  const { isDark } = useAppTheme();

  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100 dark:bg-[#0B1220]">
        <ActivityIndicator size="large" color={isDark ? "#93C5FD" : "#1F63E0"} />
      </View>
    );
  }

  return <ActivityIndicator size="large" color={isDark ? "#93C5FD" : "#1F63E0"} />;
}
