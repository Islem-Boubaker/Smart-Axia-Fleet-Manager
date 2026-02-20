import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../hooks/useRedux';
import { setCredentials, signOut as signOutAction, setLoading, setError } from '../../../store/authSlice';
import { authService, SignInCredentials, SignUpData } from '../services/auth.service';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, error } = useAppSelector((state) => state.auth);

  const signIn = useCallback(
    async (credentials: SignInCredentials) => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));
        const response = await authService.signIn(credentials);
        dispatch(setCredentials(response));
        navigate('/dashboard');
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Sign in failed';
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
        const response = await authService.signUp(data);
        dispatch(setCredentials(response));
        navigate('/dashboard');
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Sign up failed';
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
      await authService.signOut();
      dispatch(signOutAction());
      navigate('/signin');
    } catch (err) {
      console.error('Sign out error:', err);
      // Sign out locally even if API call fails
      dispatch(signOutAction());
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
