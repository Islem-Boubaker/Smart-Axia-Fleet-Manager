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
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  lastService?: Date;
  assignedDriver?: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: Date;
  status: 'active' | 'inactive';
  assignedVehicle?: string;
}

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  startDate: Date;
  endDate?: Date;
  startLocation: string;
  endLocation?: string;
  distance?: number;
  status: 'ongoing' | 'completed' | 'cancelled';
}

export interface Maintenance {
  id: string;
  vehicleId: string;
  type: 'routine' | 'repair' | 'inspection';
  description: string;
  cost: number;
  date: Date;
  status: 'scheduled' | 'in-progress' | 'completed';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
