import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
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