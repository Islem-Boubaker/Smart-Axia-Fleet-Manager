import { Redirect, Stack } from "expo-router";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

export default function AuthLayout() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );

  if (isAuthenticated) return <Redirect href="/(tabs)/home" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="forgotPassword" />
    </Stack>
  );
}

AuthLayout.displayName = 'AuthLayout';
