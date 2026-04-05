import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";

import { PrimaryButton } from "@/shared/components/ui/PrimaryButton";
import { ErrorMessage } from "@/shared/components/ui/ErrorMessage";
import { Input } from "./ui/Input";

import type { LoginCredentials } from "../auth.types";

type LoginFormProps = {
  credentials: LoginCredentials;
  setCredentials: React.Dispatch<React.SetStateAction<LoginCredentials>>;
  isLoading: boolean;
  error?: string | null;
  onLogin: () => void | Promise<void>;
};

export function LoginForm({
  credentials,
  setCredentials,
  isLoading,
  error,
  onLogin,
}: LoginFormProps) {
  const isValid = Boolean(credentials.email && credentials.password);

  return (
    <View className="flex-1 bg-white rounded-2xl p-6 my-6 shadow space-y-2">
      {/* Title */}
      <Text className="text-xl font-bold text-gray-900 mb-2">Welcome Back</Text>
      <Text className="text-sm text-gray-500 mb-6">
        Sign in to manage your trips and vehicle
      </Text>

      {/* Email Input */}
      <View className="mb-4">
        <Input
          label="Email Address"
          placeholder="Enter your email"
          value={credentials.email}
          onChangeText={(email) =>
            setCredentials((prev) => ({ ...prev, email }))
          }
          editable={!isLoading}
          icon="email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Password Input */}
      <View className="mb-4">
        <Input
          label="Password"
          placeholder="Enter your password"
          value={credentials.password}
          onChangeText={(password) =>
            setCredentials((prev) => ({ ...prev, password }))
          }
          editable={!isLoading}
          isPassword
        />
      </View>

      {/* Error */}
      {error ? <ErrorMessage message={error} /> : null}

      {/* Login Button */}
      <PrimaryButton
        label={isLoading ? "Signing in..." : "Sign In"}
        onPress={onLogin}
        loading={isLoading}
        disabled={!isValid || isLoading}
        className="mt-6"
      />

      {/* Forgot Password */}
      <TouchableOpacity
        onPress={() => router.push("/(auth)/forgotPassword")}
        className="mt-4 items-center"
      >
        <Text className="text-sm text-gray-500">Forgot your password?</Text>
        <Text className="text-sm text-blue-600 font-semibold mt-1">
          Reset it here
        </Text>
      </TouchableOpacity>
    </View>
  );
}