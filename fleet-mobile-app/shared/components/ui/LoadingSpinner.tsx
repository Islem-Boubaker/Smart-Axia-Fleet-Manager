import React from "react";
import { ActivityIndicator, Image, View } from "react-native";
import { useAppTheme } from "@/shared/theme/ThemeProvider";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
}

export function LoadingSpinner({ fullScreen = false }: LoadingSpinnerProps) {
  const { isDark } = useAppTheme();
  const indicator = (
    <View className="items-center justify-center">
      <Image
        source={require("../../../assets/images/splash-logo-black.png")}
        resizeMode="contain"
        style={{ width: 132, height: 132, marginBottom: 16 }}
      />
      <ActivityIndicator size="large" color={isDark ? "#93C5FD" : "#1F63E0"} />
    </View>
  );

  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        {indicator}
      </View>
    );
  }

  return indicator;
}
