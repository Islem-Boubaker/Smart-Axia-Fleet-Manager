import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  View,
} from "react-native";

import LoginHeader from "../components/LoginHeader";
import { LoginForm } from "../components/LoginForm";
import { LoginFooter } from "../components/LoginFooter";
import { useLogin } from "../hooks/useLogin";

export default function SignInScreen() {
  const {
    credentials,
    showPassword,
    isLoading,
    loadingProvider,
    error,
    linkSent,
    onEmailChange,
    onPasswordChange,
    onTogglePassword,
    onSubmit,
   
    onLoginWithGoogle,
    onLoginWithApple,
    onForgotPassword,
    showApple,
  } = useLogin();

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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
            linkSent={linkSent}
            showApple={showApple}
            onEmailChange={onEmailChange}
            onPasswordChange={onPasswordChange}
            onTogglePassword={onTogglePassword}
            onSubmit={onSubmit}
            
            onLoginWithGoogle={onLoginWithGoogle}
            onLoginWithApple={onLoginWithApple}
            onForgotPassword={onForgotPassword}
          />

          <View className="mt-8">
            <LoginFooter />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
