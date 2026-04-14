import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "../features/auth/pages/Signin";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import VehiclesPage from "../features/vehicles/pages/VehiclesPage";
import VehicleDetailsPage from "../features/fleet/pages/VehicleDetailsPage";
import MaintenancePage from "../features/maintenance/pages/MaintenancePage";
import DriversPage from "../features/drivers/pages/DriversPage";
import TripsPage from "../features/trips/pages/TripsPage";
import ReportsPage from "../features/reports/pages/ReportsPage";
import SettingsPage from "../features/settings/pages/SettingsPage";
import { ROUTES } from "../utils/constants.js";
import { DashboardLayout } from "../shared/components/index.js";
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes — "/" and /signin both show sign in */}
        <Route path={ROUTES.HOME} element={<SignIn />} />
        <Route path={ROUTES.SIGN_IN} element={<SignIn />} />

        {/* Protected Routes */}
        <Route element={<DashboardLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.VEHICLES} element={<VehiclesPage />} />
          <Route path="/fleet/details/:id" element={<VehicleDetailsPage />} />
          <Route path={ROUTES.DRIVERS} element={<DriversPage />} />
          <Route path={ROUTES.TRIPS} element={<TripsPage />} />
          <Route path={ROUTES.MAINTENANCE} element={<MaintenancePage />} />
          <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<Navigate to={ROUTES.SIGN_IN} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
