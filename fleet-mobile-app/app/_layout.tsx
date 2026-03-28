import "../index.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Provider, useSelector } from "react-redux";
import { View, ActivityIndicator } from "react-native";

import { store } from "../store/index";
import type { RootState } from "../store";

import { useAuthGuard } from "../features/auth/hooks/useAuth";
import { useRealtimeNotificationToasts } from "../features/notifications/hooks/useRealtimeNotificationToasts";
import { ToastProvider } from "../shared/components/toast";

function AppLayout() {
  useAuthGuard();
  useRealtimeNotificationToasts();

  const isLoading = useSelector((state: RootState) => state.auth.isLoading);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        <Stack.Screen
          name="notifications/index"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="trips/[id]"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="trips/live"
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="maps/index"
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="reclamations/create"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="profile/settings"
          options={{ animation: "slide_from_right" }}
        />
      </Stack>

      {isLoading && (
        <View className="absolute inset-0 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#2D9B6F" />
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ToastProvider>
          <AppLayout />
        </ToastProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
