export const API_BASE_URL = import.meta.env.VITE_API_URL;
export const FUEL_PRICE_TND = 2.395;

export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/signin',
  DASHBOARD: '/dashboard',
  VEHICLES: '/vehicles',
  DRIVERS: '/drivers',
  TRIPS: '/trips',
  MAINTENANCE: '/maintenance',
  REPORTS: '/reports',
  DRIVER_ISSUES: '/driver-issues',
  SETTINGS: '/settings',
  FLEET: '/fleet',
};

export const VEHICLE_STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  inactive: 'bg-gray-100 text-gray-800',
} as const;

export const DRIVER_STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
} as const;
