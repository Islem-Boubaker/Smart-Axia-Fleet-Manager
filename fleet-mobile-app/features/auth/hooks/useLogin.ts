import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login as loginApi } from '../services/auth.api';
import { setLoading } from '@/store/slices/authSlice';
import type { RootState, AppDispatch } from '@/store';
import type { LoginCredentials } from '../auth.types';

export function useLogin() {
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        dispatch(setLoading(true));
        await loginApi(credentials.email, credentials.password);
      } catch (err: unknown) {
        dispatch(setLoading(false));
        const message =
          err instanceof Error ? err.message : 'Login failed. Please try again.';
        throw new Error(message);
      }
    },
    [dispatch]
  );

  return { login, isLoading, error: null };
}
