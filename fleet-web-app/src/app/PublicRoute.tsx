import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../shared/hooks';
import { SimpleLoader } from '../shared/components';

export default function PublicRoute() {
  const { isAuthenticated, initialized, user } = useAppSelector((state) => state.auth);

  // Wait for /me bootstrap before deciding whether to redirect.
  if (!initialized) return <SimpleLoader />;

  // Only redirect to the dashboard if the session belongs to an ADMIN.
  // A DRIVER who somehow has a valid cookie must not enter this admin UI.
  if (isAuthenticated && user?.role?.toLowerCase() === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
