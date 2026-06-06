import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../shared/hooks';
import { setLogoutInProgress } from '../../../shared/services/logoutFlag';
import { clearClientAuthState, clearLogoutMarker, markLoggedIn } from '../../../shared/services/authCleanup';
import { setUser, setLoading, setError } from '../../../store/authSlice';
import { authAPI } from '../services/auth.service';
import type { SignInCredentials} from '../services/auth.service';

const ADMIN_ROLE = 'admin';

const isAdmin = (role?: string) => role?.toLowerCase() === ADMIN_ROLE;

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, initialized, loading, error } = useAppSelector(
    (state) => state.auth,
  );

  const signInMutation = useMutation({ mutationFn: authAPI.signIn });
  const signOutMutation = useMutation({ mutationFn: authAPI.signOut });

  // ── signIn ──────────────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (credentials: SignInCredentials) => {
      dispatch(setLoading(true));
      dispatch(setError(null));

      // Allow the refresh interceptor (may have been suppressed by a prior logout).
      setLogoutInProgress(false);

      try {
        const authUser = await signInMutation.mutateAsync(credentials);

        // ── Role guard: only ADMIN may enter this dashboard ──────────────────
        if (!isAdmin(authUser.role)) {
          // Best-effort: ask the backend to clear the session cookie it just set.
          try {
            await authAPI.signOut();
          } catch {
            // ignore — we always clean up locally
          }
          await clearClientAuthState(queryClient, dispatch);
          dispatch(setError('auth.accessDenied'));
          navigate('/signin', { replace: true });
          return;
        }

        // Successful ADMIN login — clear the logout marker so future page
        // loads run the /me bootstrap normally instead of staying on /signin.
        clearLogoutMarker();
        markLoggedIn();

        dispatch(setUser(authUser));
        navigate('/dashboard', { replace: true });
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        const message = axiosErr.response?.data?.message || 'auth.signInFailed';
        dispatch(setError(message));
        throw err;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, navigate, queryClient, signInMutation],
  );

  // ── signOut ─────────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    try {
      await signOutMutation.mutateAsync();
    } catch {
      // Ignore API errors — we always clean up locally.
    } finally {
      await clearClientAuthState(queryClient, dispatch);
      navigate('/signin', { replace: true });
    }
  }, [dispatch, navigate, queryClient, signOutMutation]);

  // ── forgotPassword ───────────────────────────────────────────────────────────
  const forgotPassword = useCallback(
    async (email: string) => {
      try {
        await authAPI.forgotPassword(email);
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
        const message = axiosErr.response?.data?.message ?? axiosErr.message ?? 'auth.forgotFailed';
        dispatch(setError(message));
        throw err;
      }
    },
    [dispatch],
  );

  return {
    user,
    isAuthenticated,
    initialized,
    loading,
    error,
    signIn,
    signOut,
    forgotPassword,
  };
};
