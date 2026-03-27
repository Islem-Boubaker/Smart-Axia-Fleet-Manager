import "../index.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Provider, useSelector } from "react-redux";
import { View, ActivityIndicator } from "react-native";

import { store } from "../store/index";
import type { RootState } from "../store";

function AppLayout() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2D9B6F" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="/home" />

          <Stack.Screen
            name="notifications"
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
            name="maps"
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
        </>
      ) : (
        <Stack.Screen
          name="/login"
          options={{ headerShown: false, gestureEnabled: false }}
        />
      )}

      
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppLayout />
      </SafeAreaProvider>
    </Provider>
  );
}


