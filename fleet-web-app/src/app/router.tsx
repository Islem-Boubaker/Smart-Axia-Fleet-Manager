// src/app/router.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ROUTES } from "../utils/constants";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

// Lazy load components
const SignIn = lazy(() => import("../features/auth/pages/Signin"));
const DashboardLayout = lazy(
  () =>
    import("../shared/components/layout/DashboardLayout").then((module) => ({
      default: module.DashboardLayout,
    })),
);
const DashboardPage = lazy(
  () => import("../features/dashboard/pages/DashboardPage"),
);
const VehiclesPage = lazy(
  () => import("../features/vehicles/pages/VehiclesPage"),
);
const MaintenancePage = lazy(
  () => import("../features/maintenance/pages/MaintenancePage"),
);
const DriversPage = lazy(() => import("../features/drivers/pages/DriversPage"));
const TripsPage = lazy(() => import("../features/trips/pages/TripsPage"));
const ReportsPage = lazy(() => import("../features/reports/pages/ReportsPage"));
const DriverIssuesPage = lazy(
  () => import("../features/reclamations/pages/DriverIssuesPage"),
);
const SettingsPage = lazy(
  () => import("../features/settings/pages/SettingsPage"),
);

// Loading component
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/signin" replace />} />

          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            <Route path={ROUTES.SIGN_IN} element={<SignIn />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
              <Route path={ROUTES.VEHICLES} element={<VehiclesPage />} />
              <Route path={ROUTES.DRIVERS} element={<DriversPage />} />
              <Route path={ROUTES.TRIPS} element={<TripsPage />} />
              <Route path={ROUTES.MAINTENANCE} element={<MaintenancePage />} />
              <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
              <Route
                path={ROUTES.DRIVER_ISSUES}
                element={<DriverIssuesPage />}
              />
              <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
