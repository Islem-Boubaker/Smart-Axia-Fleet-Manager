import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

import { PrimaryButton } from "../../../shared/components/ui/PrimaryButton";
import { ErrorMessage } from "../../../shared/components/ui/ErrorMessage";
import { Input as PasswordInput } from "./ui/Input";

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
  const [showPassword, setShowPassword] = useState(false);

  const isValid = Boolean(credentials.email && credentials.password);

  return (
    <View className="flex-1 bg-white rounded-2xl p-6 my-6 shadow">

      {/* Title */}
      <Text className="text-xl font-bold text-gray-900 mb-2">
        Welcome Back
      </Text>

      <Text className="text-sm text-gray-500 mb-6">
        Sign in to manage your trips and vehicle
      </Text>

      {/* Email Input */}
      <View className="mb-6">
        <Text className="text-sm font-semibold text-gray-900 mb-2">
          Email Address
        </Text>

        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-4">

          <MaterialCommunityIcons
            name="email"
            size={20}
            color="#9CA3AF"
            style={{ marginRight: 8 }}
          />

          <TextInput
            className="flex-1 py-3 text-[15px] text-gray-900"
            placeholder="Enter your email"
            placeholderTextColor="#9CA3AF"
            value={credentials.email}
            onChangeText={(email) =>
              setCredentials((prev) => ({ ...prev, email }))
            }
            editable={!isLoading}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Password Input */}
      <PasswordInput
        value={credentials.password}
        onChangeText={(password) =>
          setCredentials((prev) => ({ ...prev, password }))
        }
        editable={!isLoading}
        showPassword={showPassword}
        onToggleVisibility={() => setShowPassword((prev) => !prev)}
      />

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
        <Text className="text-sm text-gray-500">
          Forgot your password?
        </Text>

        <Text className="text-sm text-blue-600 font-semibold mt-1">
          Reset it here
        </Text>
      </TouchableOpacity>

    </View>
  );
}