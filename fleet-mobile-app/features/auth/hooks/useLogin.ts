import { useCallback } from "react";
import type { LoginCredentials } from "../auth.types";
import { useAuthActions } from "./useAuth";

export function useLogin() {
  const { loginWithEmailPassword, isLoading } = useAuthActions();

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      await loginWithEmailPassword(credentials.email, credentials.password);
    },
    [loginWithEmailPassword]
  );

  return { login, isLoading, error: null };
}
