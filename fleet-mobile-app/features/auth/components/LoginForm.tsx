import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import type { LoginCredentials } from "../types/auth.types";

type LoginFormProps = {
  credentials: LoginCredentials;
  showPassword: boolean;
  isLoading: boolean;
  loadingProvider: "email" | null;
  error: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onSubmit: () => void;
  onForgotPassword: () => void;
};

export function LoginForm({
  credentials,
  showPassword,
  isLoading,
  loadingProvider,
  error,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
  onForgotPassword,
}: LoginFormProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Email Input */}
      <View>
        <Text className="text-xs font-bold text-[#1A1233] mb-2 tracking-wide uppercase">
          {t("auth.login.emailLabel")}
        </Text>
        <TextInput
          className="bg-[#FAFAFA] border border-[#E4E2F0] rounded-2xl px-4 py-3.5 text-sm text-[#1A1233]"
          placeholder={t("auth.login.emailPlaceholder")}
          placeholderTextColor="#BDB8D4"
          keyboardType="email-address"
          autoCapitalize="none"
          value={credentials.email}
          onChangeText={onEmailChange}
          editable={!isLoading}
        />
      </View>

      {/* Password Input */}
      <View className="mt-5">
        <Text className="text-xs font-bold text-[#1A1233] mb-2 tracking-wide uppercase">
          {t("auth.login.passwordLabel")}
        </Text>
        <View className="relative">
          <TextInput
            className="bg-[#FAFAFA] border border-[#E4E2F0] rounded-2xl px-4 py-3.5 text-sm text-[#1A1233] pr-12"
            placeholder={t("auth.login.passwordPlaceholder")}
            placeholderTextColor="#BDB8D4"
            secureTextEntry={!showPassword}
            value={credentials.password}
            onChangeText={onPasswordChange}
            editable={!isLoading}
          />
          <TouchableOpacity
            className="absolute right-4 top-3.5"
            onPress={onTogglePassword}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#8E8BA8"
            />
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          <Text className="text-red-500 text-xs font-medium">{error}</Text>
        </View>
      )}

      {/* Actions */}
      <View className="flex-row items-center justify-between mt-3">
        <TouchableOpacity onPress={onForgotPassword} disabled={isLoading}>
          <Text className="text-[12.5px] font-bold text-blue-600">
            {t("auth.login.forgotPassword")}
          </Text>
        </TouchableOpacity>
      </View>

      

      {/* Submit Button */}
      <TouchableOpacity
        className="mt-6 rounded-2xl overflow-hidden"
        onPress={onSubmit}
        activeOpacity={0.85}
        disabled={isLoading}
      >
        <LinearGradient
          colors={["#3B82F6", "#1D4ED8"]} // Blue gradient: blue-500 to blue-700
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="py-4 items-center"
        >
          {loadingProvider === "email" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-[15px] font-bold tracking-wide">
              {t("auth.login.submit")}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </>
  );
}
