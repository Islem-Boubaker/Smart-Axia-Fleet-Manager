import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '../shared/hooks';
import { clearClientAuthState } from '../shared/services/authCleanup';
import { SimpleLoader } from '../shared/components';

export default function ProtectedRoute() {
  const { isAuthenticated, initialized, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  // If authenticated but not ADMIN, clear everything and fall through to redirect.
  useEffect(() => {
    if (initialized && isAuthenticated && !isAdmin) {
      void clearClientAuthState(queryClient, dispatch);
    }
  }, [initialized, isAuthenticated, isAdmin, queryClient, dispatch]);

  // Wait for /me bootstrap to finish before making any routing decision.
  if (!initialized) return <SimpleLoader />;

  // Not logged in.
  if (!isAuthenticated) return <Navigate to="/signin" replace />;

  // Logged in but wrong role — clearClientAuthState fired above; redirect now.
  if (!isAdmin) return <Navigate to="/signin" replace />;

  return <Outlet />;
}
