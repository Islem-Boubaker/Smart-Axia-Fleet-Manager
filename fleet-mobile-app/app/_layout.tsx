import "../index.css";
import "../i18n";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Provider, useSelector } from "react-redux";
import { View, ActivityIndicator } from "react-native";

import { store } from "../store/index";
import type { RootState } from "../store";

import { useAuthBootstrap, useAuthGuard } from "../features/auth/hooks/useAuth";
import { useRealtimeNotificationToasts } from "../features/notifications/hooks/useRealtimeNotificationToasts";
import { usePushTokenRegistration } from "../features/notifications/hooks/usePushTokenRegistration";
import { ToastProvider } from "../shared/components/toast";
import { RequiredUpdateGate } from "../shared/components/updates/RequiredUpdateGate";
import { ThemeProvider } from "../shared/theme/ThemeProvider";

function AppLayout() {
  useAuthBootstrap();
  useAuthGuard();
  useRealtimeNotificationToasts();
  usePushTokenRegistration();

  const isLoading = useSelector((state: RootState) => state.auth.isLoading);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-[#0B1220]">
        <ActivityIndicator size="large" color="#2D9B6F" />
      </View>
    );
  }

  return (
    <>
      <View className="flex-1 bg-gray-100 dark:bg-[#0B1220]">
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
          name="reclamations/create"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="profile/edit"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="profile/change-password"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="profile/email-notifications"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="profile/language"
          options={{ animation: "slide_from_right" }}
        />
      </Stack>
      </View>
    </>
  );
}

export default function RootLayout() {

  return (
   
      <Provider store={store}>
        <SafeAreaProvider>
          <ThemeProvider>
            <ToastProvider>
              <AppLayout />
              <RequiredUpdateGate />
            </ToastProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </Provider>
   
  );
}
