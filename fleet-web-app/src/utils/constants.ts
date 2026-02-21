export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/signin',
  SIGN_UP: '/signup',
  DASHBOARD: '/dashboard',
  VEHICLES: '/vehicles',
  DRIVERS: '/drivers',
  TRIPS: '/trips',
  MAINTENANCE: '/maintenance',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;

export const VEHICLE_STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  inactive: 'bg-gray-100 text-gray-800',
} as const;

export const DRIVER_STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
} as const;
