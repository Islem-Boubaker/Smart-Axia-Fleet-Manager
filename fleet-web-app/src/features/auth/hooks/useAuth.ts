// ─────────────────────────────────────────────────────────────
//  useAuth — cookie-based auth hook (no tokens in JS)
// ─────────────────────────────────────────────────────────────
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../shared/hooks';
import { setUser, clearUser, setLoading, setError } from '../../../store/authSlice';
import { authAPI } from '../services/auth.service';
import type { SignInCredentials, SignUpData } from '../services/auth.service';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

  const signIn = useCallback(
    async (credentials: SignInCredentials) => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));
        const authUser = await authAPI.signIn(credentials);
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
    [dispatch, navigate]
  );

  const signUp = useCallback(
    async (data: SignUpData) => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));
        const authUser = await authAPI.signUp(data);
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
    [dispatch, navigate]
  );

  const signOut = useCallback(async () => {
    try {
      await authAPI.signOut();
      dispatch(clearUser());
      navigate('/signin');
    } catch (err) {
      console.error('Sign out error:', err);
      // Clear locally even if API call fails
      dispatch(clearUser());
      navigate('/signin');
    }
  }, [dispatch, navigate]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  };
};
