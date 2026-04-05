import React, { useState } from "react";
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useLogin } from "../hooks/useLogin";
import type { LoginCredentials } from "../auth.types";
import {
  testNetworkConnection,
  logLoginError,
} from "@/shared/services/network.diagnostics";

import { LoginHeader } from "../components/LoginHeader";
import { LoginForm } from "../components/LoginForm";
import { LoginFooter } from "../components/LoginFooter";

export function LoginScreen() {
  const { login, isLoading, error } = useLogin();
  const [localError, setLocalError] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const diagnostics = await testNetworkConnection();
      const message = `
API URL: ${diagnostics.apiUrl}
Backend Reachable: ${diagnostics.isBackendReachable ? "✅ Yes" : "❌ No"}
CORS Enabled: ${diagnostics.corsEnabled ? "✅ Yes" : "❌ No"} 
Login Endpoint: ${diagnostics.loginEndpointExists ? "✅ Exists" : "❌ Not found"}
${diagnostics.errorMessage ? `Error: ${diagnostics.errorMessage}` : ""}
      `.trim();

      Alert.alert("Network Diagnostics", message);
    } catch (error) {
      Alert.alert("Test Failed", `Connection test error: ${error}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleLogin = async () => {
    if (!credentials.email || !credentials.password) {
      setLocalError("Please enter both email and password");
      return;
    }

    try {
      setLocalError(null);
      await login(credentials);
      router.replace("/(tabs)/home");
    } catch (err: any) {
      const message = err?.message || "Login failed. Please try again.";
      setLocalError(message);
      logLoginError(err);
      Alert.alert("Login Error", message);
    }
  };

  const displayError = localError || error;

  return (
    <SafeAreaView
      className="flex-1 bg-gray-100"
      edges={["top", "left", "right"]}
    >
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
            error={displayError}
            onLogin={handleLogin}
          />

          {/* Network Test Button */}
          <TouchableOpacity
            onPress={handleTestConnection}
            disabled={isTestingConnection}
            className="mt-6 py-3 px-4 bg-blue-100 rounded-lg"
          >
            <Text className="text-center text-blue-600 font-semibold">
              {isTestingConnection
                ? "Testing Connection..."
                : "Test Connection"}
            </Text>
          </TouchableOpacity>

          <LoginFooter />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default LoginScreen;
