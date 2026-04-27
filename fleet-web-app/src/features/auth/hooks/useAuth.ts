// ─────────────────────────────────────────────────────────────
//  useAuth — cookie-based auth hook (no tokens in JS)
// ─────────────────────────────────────────────────────────────
import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../shared/hooks';
import { setUser, clearUser, setLoading, setError } from '../../../store/authSlice';
import { authAPI } from '../services/auth.service';
import type { SignInCredentials, SignUpData } from '../services/auth.service';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

  const signInMutation = useMutation({ mutationFn: authAPI.signIn });
  const signUpMutation = useMutation({ mutationFn: authAPI.signUp });
  const signOutMutation = useMutation({ mutationFn: authAPI.signOut });

  const signIn = useCallback(
    async (credentials: SignInCredentials) => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));
        const authUser = await signInMutation.mutateAsync(credentials);
        dispatch(setUser(authUser));
        navigate('/dashboard');
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        const errorMessage = axiosErr.response?.data?.message || 'Sign in failed';
        dispatch(setError(errorMessage));
        throw err;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, navigate, signInMutation]
  );

  const signUp = useCallback(
    async (data: SignUpData) => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));
        const authUser = await signUpMutation.mutateAsync(data);
        dispatch(setUser(authUser));
        navigate('/dashboard');
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        const errorMessage = axiosErr.response?.data?.message || 'Sign up failed';
        dispatch(setError(errorMessage));
        throw err;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, navigate, signUpMutation]
  );

  const signOut = useCallback(async () => {
    try {
      await signOutMutation.mutateAsync();
      dispatch(clearUser());
      navigate('/signin');
    } catch (err) {
      console.error('Sign out error:', err);
      // Clear locally even if API call fails
      dispatch(clearUser());
      navigate('/signin');
    }
  }, [dispatch, navigate, signOutMutation]);
  const forgotPassword = useCallback(
    async (email: string) => {
      try {
        await authAPI.forgotPassword(email);
      } catch (error: unknown) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        const errorMessage = axiosError.response?.data?.message || axiosError.message || 'Failed to request new password';
        dispatch(setError(errorMessage));
        throw error;
      }
    },
    [dispatch]
  );

  return {
    user,
    isAuthenticated,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    forgotPassword,
  };
};

