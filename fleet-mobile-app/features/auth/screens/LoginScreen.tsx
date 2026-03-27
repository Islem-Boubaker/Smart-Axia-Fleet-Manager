import React, { useState } from "react";
import { ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLogin } from "../hooks/useLogin";
import type { LoginCredentials } from "../auth.types";

import { LoginHeader } from "../components/LoginHeader";
import { LoginForm } from "../components/LoginForm";
import { LoginFooter } from "../components/LoginFooter";

export function LoginScreen() {
  const { login, isLoading, error } = useLogin();

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });

  const handleLogin = async () => {
    if (!credentials.email || !credentials.password) return;
    await login(credentials);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="flex-grow px-6 py-6"
        >
          <LoginHeader />

          <LoginForm
            credentials={credentials}
            setCredentials={setCredentials}
            isLoading={isLoading}
            error={error}
            onLogin={handleLogin}
          />

          <LoginFooter />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default LoginScreen;