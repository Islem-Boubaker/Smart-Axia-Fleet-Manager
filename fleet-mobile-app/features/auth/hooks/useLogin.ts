import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Platform } from "react-native";
import type { LoginCredentials } from "../types/auth.types";
import { useAuthActions } from "./useAuth";

export function useLogin() {
  const router = useRouter();
  const {
    loginWithGoogle,
    loginWithApple,
    loginWithEmailPassword,
    sendEmailOtp,
    isLoading: authLoading,
  } = useAuthActions();

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<
    "google" | "apple" | "email" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [linkSent, setLinkSent] = useState(false);

  const onEmailChange = useCallback((email: string) => {
    setCredentials((prev) => ({ ...prev, email }));
    setError(null);
    setLinkSent(false);
  }, []);

  const onPasswordChange = useCallback((password: string) => {
    setCredentials((prev) => ({ ...prev, password }));
    setError(null);
  }, []);

  const onTogglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const onLoginWithGoogle = useCallback(async () => {
    try {
      setLoadingProvider("google");
      setError(null);
      await loginWithGoogle();
      router.replace("/(tabs)/home");
    } catch (err: any) {
      if (String(err?.message || "").toLowerCase().includes("cancel")) return;
      setError(err?.message || "Google sign-in failed.");
    } finally {
      setLoadingProvider(null);
    }
  }, [loginWithGoogle, router]);

  const onLoginWithApple = useCallback(async () => {
    try {
      setLoadingProvider("apple");
      setError(null);
      await loginWithApple();
      router.replace("/(tabs)/home");
    } catch (err: any) {
      if (
        err?.code === "ERR_REQUEST_CANCELED" ||
        String(err?.message || "").toLowerCase().includes("cancel")
      ) {
        return;
      }
      setError(err?.message || "Apple sign-in failed.");
    } finally {
      setLoadingProvider(null);
    }
  }, [loginWithApple, router]);

  const onSubmit = useCallback(async () => {
    const email = credentials.email.trim();
    if (!email) {
      setError("Please enter your email.");
      return;
    }

    if (!credentials.password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoadingProvider("email");
      setError(null);
      await loginWithEmailPassword(email, credentials.password);
      router.replace("/(tabs)/home");
    } catch (err: any) {
      setError(err?.message || "Sign-in failed. Please try again.");
    } finally {
      setLoadingProvider(null);
    }
  }, [credentials.email, credentials.password, loginWithEmailPassword, router]);

  const onSendMagicLink = useCallback(async () => {
    const email = credentials.email.trim();
    if (!email) {
      setError("Please enter your email to receive a magic link.");
      return;
    }

    try {
      setLoadingProvider("email");
      setError(null);
      await sendEmailOtp(email);
      setLinkSent(true);
    } catch (err: any) {
      setError(err?.message || "Failed to send magic link.");
    } finally {
      setLoadingProvider(null);
    }
  }, [credentials.email, sendEmailOtp]);

  const onForgotPassword = useCallback(() => {
    router.push("/(auth)/forgotPassword");
  }, [router]);

  const isLoading = useMemo(
    () => loadingProvider !== null || authLoading,
    [authLoading, loadingProvider],
  );

  return {
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
    onSendMagicLink,
    onLoginWithGoogle,
    onLoginWithApple,
    onForgotPassword,
    showApple: Platform.OS === "ios",
  };
}
