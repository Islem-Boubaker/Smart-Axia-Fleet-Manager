import React from "react";
import { ScrollView, StatusBar, View } from "react-native";

import LoginHeader from "../components/LoginHeader";
import { LoginForm } from "../components/LoginForm";
import { useLogin } from "../hooks/useLogin";

export default function SignInScreen() {
  const {
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
  } = useLogin();

  return (
    <ScrollView
      className="flex-1 bg-[#F4F3FB]"
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle="light-content" />

      <View className="px-7 pt-8 pb-10">
        <LoginHeader />

        <LoginForm
          credentials={credentials}
          showPassword={showPassword}
          isLoading={isLoading}
          loadingProvider={loadingProvider}
          error={error}
          onEmailChange={onEmailChange}
          onPasswordChange={onPasswordChange}
          onTogglePassword={onTogglePassword}
          onSubmit={onSubmit}
          onForgotPassword={onForgotPassword}
        />

        <View className="h-6" />
      </View>
    </ScrollView>
  );
}
