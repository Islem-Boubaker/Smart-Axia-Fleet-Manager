// src/router/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { type RootState } from "../store"; // Adjust path to your store
import { SimpleLoader } from "../shared/components";

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useSelector(
    (state: RootState) => state.auth,
  );

  // Show loading state while checking auth
  if (loading) {
    return <SimpleLoader />;
  }

  // Redirect to sign in if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
}
