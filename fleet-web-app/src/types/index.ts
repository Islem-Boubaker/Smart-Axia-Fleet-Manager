export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'driver';
  avatar?: string;
}

export interface Vehicle {
  id: string;
  vin?: string;
  name: string;
  photos?: string[];
  plaque_immatriculation?: string;
  type: 'car' | 'truck' | 'motorcycle' | 'van';
  Active: boolean;
  Vehicle_Model: 'Car' | 'SUV' | 'Van' | 'Truck' | 'Bus' | 'Motorcycle';
  max_load?: number | null;
  insurance_expiry_date?: string | null;
  tech_visit_expiry_date?: string | null;
  Mileage: number;
  Vehicle_Age: number;
  Engine_Size?: number | null;
  Tire_Condition: 'New' | 'Good' | 'Worn Out';
  Brake_Condition: 'New' | 'Good' | 'Worn Out';
  Battery_Status: 'New' | 'Good' | 'Weak';
  Need_Maintenance: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  status: 'active' | 'inactive' | 'on-leave';
  assignedVehicle?: string;
  totalTrips?: number;
  rating?: number;
  role?: string;
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
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
