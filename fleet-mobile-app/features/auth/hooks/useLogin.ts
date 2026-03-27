import { useState, useCallback } from 'react';
import { login as loginApi } from '../services/auth.api';
import type { LoginCredentials } from '../auth.types';

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      await loginApi(credentials.email, credentials.password);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { login, isLoading, error };
}
