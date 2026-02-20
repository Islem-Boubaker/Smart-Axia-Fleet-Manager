export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'driver';
  avatar?: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  status: 'active' | 'maintenance' | 'inactive';
  mileage: number;
  fuelType: 'essence' | 'diesel' | 'électrique' | 'hybride';
  lastService?: string;
  driver?: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: 'active' | 'inactive';
  assignedVehicle?: string;
  totalTrips?: number;
  rating?: number;
}

export interface Trip {
  id: string;
  vehicle: string;
  driver: string;
  startLocation: string;
  endLocation: string;
  startTime: string;
  endTime: string | null;
  distance: string;
  status: 'ongoing' | 'completed' | 'cancelled' | 'scheduled';
  fuel: string;
  cost: string;
}

export interface Maintenance {
  id: string;
  vehicle: string;
  type: string;
  description: string;
  scheduledDate: string;
  completedDate: string | null;
  status: string;
  mileage: number;
  cost: string;
  technician: string;
  priority: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
