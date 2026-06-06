import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import type { LoginCredentials } from "../types/auth.types";
import { useAuthActions } from "./useAuth";

export function useLogin() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    loginWithEmailPassword,
    isLoading: authLoading,
  } = useAuthActions();

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<
    "email" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const getLoginErrorMessage = useCallback(
    (err: any) => {
      const status = err?.response?.status;
      const message = String(err?.message ?? "").toLowerCase();
      if (
        status === 401 ||
        status === 403 ||
        message.includes("only driver") ||
        message.includes("credential") ||
        message.includes("password") ||
        message.includes("login failed") ||
        message.includes("sign-in failed")
      ) {
        if (message.includes("only driver")) {
          return t("auth.login.errors.driverOnly");
        }
        return t("auth.login.errors.invalidCredentials");
      }
      return t("auth.login.errors.generic");
    },
    [t],
  );

  const onEmailChange = useCallback((email: string) => {
    setCredentials((prev) => ({ ...prev, email }));
    setError(null);
  }, []);

  const onPasswordChange = useCallback((password: string) => {
    setCredentials((prev) => ({ ...prev, password }));
    setError(null);
  }, []);

  const onTogglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const onSubmit = useCallback(async () => {
    const email = credentials.email.trim();
    if (!email) {
      setError(t("auth.login.errors.emailRequired"));
      return;
    }

    if (!credentials.password) {
      setError(t("auth.login.errors.passwordRequired"));
      return;
    }

    try {
      setLoadingProvider("email");
      setError(null);
      await loginWithEmailPassword(email, credentials.password);
      router.replace("/(tabs)/home");
    } catch (err: any) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoadingProvider(null);
    }
  }, [credentials.email, credentials.password, getLoginErrorMessage, loginWithEmailPassword, router, t]);

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
    onEmailChange,
    onPasswordChange,
    onTogglePassword,
    onSubmit,
    onForgotPassword,
  };
}
