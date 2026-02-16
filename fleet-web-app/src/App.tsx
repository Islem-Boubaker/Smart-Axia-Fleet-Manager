import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './features/auth/pages/Signin';
import SignUp from './features/auth/pages/Signup';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { ROUTES } from './utils/constants';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.SIGN_IN} element={<SignIn />} />
        <Route path={ROUTES.SIGN_UP} element={<SignUp />} />
        
        {/* Protected Routes */}
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.VEHICLES} element={<Vehicles />} />
        <Route path={ROUTES.DRIVERS} element={<Drivers />} />
        <Route path={ROUTES.TRIPS} element={<Trips />} />
        <Route path={ROUTES.MAINTENANCE} element={<Maintenance />} />
        <Route path={ROUTES.REPORTS} element={<Reports />} />
        <Route path={ROUTES.SETTINGS} element={<Settings />} />
        
        {/* Default Route */}
        <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        
        {/* 404 Route */}
        <Route path="*" element={<Navigate to={ROUTES.SIGN_IN} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
