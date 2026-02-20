import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from '../features/auth/pages/Signin';
import SignUp from '../features/auth/pages/Signup';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import VehiclesPage from '../features/vehicles/pages/VehiclesPage';
import MaintenancePage from '../features/maintenance/pages/MaintenancePage';
import FleetPage from '../features/fleet/pages/FleetPage';
import DriversPage from '../features/drivers/pages/DriversPage';
import TripsPage from '../features/trips/pages/TripsPage';
import ReportsPage from '../features/reports/pages/ReportsPage';
import SettingsPage from '../features/settings/pages/SettingsPage';

// Route constants
export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/signin',
  SIGN_UP: '/signup',
  DASHBOARD: '/dashboard',
  VEHICLES: '/vehicles',
  DRIVERS: '/drivers',
  TRIPS: '/trips',
  MAINTENANCE: '/maintenance',
  FLEET: '/fleet',
  REPORTS: '/reports',
  SETTINGS: '/settings',
};

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.SIGN_IN} element={<SignIn />} />
        <Route path={ROUTES.SIGN_UP} element={<SignUp />} />
        
        {/* Protected Routes */}
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTES.VEHICLES} element={<VehiclesPage />} />
        <Route path={ROUTES.FLEET} element={<FleetPage />} />
        <Route path={ROUTES.DRIVERS} element={<DriversPage />} />
        <Route path={ROUTES.TRIPS} element={<TripsPage />} />
        <Route path={ROUTES.MAINTENANCE} element={<MaintenancePage />} />
        <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
        <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
        
        {/* Default Route */}
        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        
        {/* 404 Route */}
        <Route path="*" element={<Navigate to={ROUTES.SIGN_IN} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
