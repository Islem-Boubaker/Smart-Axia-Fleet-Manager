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
  type: 'car' | 'suv' | 'truck' | 'motorcycle' | 'van';
  Active: boolean;
  Vehicle_Model: 'Car' | 'SUV' | 'Van' | 'Truck' | 'Bus' | 'Motorcycle';
  max_load?: number | null;
  insurance_expiry_date?: string | null;
  tech_visit_expiry_date?: string | null;
  consumption?: number | null;
  Mileage: number;
  Vehicle_Age: number;
  Engine_Size?: number | null;
  Tire_Condition: 'New' | 'Good' | 'Worn Out';
  Brake_Condition: 'New' | 'Good' | 'Worn Out';
  Battery_Status: 'New' | 'Good' | 'Weak';
  Need_Maintenance: boolean;
  maintenance_recommandation_ai?: unknown;
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
  avatar?: string;
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

export interface TripStop {
  id: string;
  tripId: string;
  stopOrder: number;
  locationName: string;
  latitude?: number;
  longitude?: number;
  status: 'pending' | 'reached' | 'skipped';
  arrivalTime?: string;
  estimatedArrival?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  userId?: string;
  vehicleId: string;
  region?: string;
  notes?: string;
  startLocation: string;
  startLatitude?: number;
  startLongitude?: number;
  endLocation: string;
  endLatitude?: number;
  endLongitude?: number;
  startTime: string;
  endTime?: string;
  distance: number;
  fuel?: number;
  revenue?: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  stops?: TripStop[]; // Array of stops when included
  driver?: {
    id: string;
    name: string;
  };
  vehicle?: {
    id: string;
    name: string;
    plaque_immatriculation?: string;
    consumption?: number | null;
  };
}

export interface Maintenance {
  id: string;
  vehicleId?: string;
  vehicleName?: string;
  vehiclePlate: string;
  scheduledDate: string;
  completedAt?: string;
  technician: string;
  cost: number;
  mileage?: number;
  priority: 'low' | 'medium' | 'high';
  status: 'scheduled' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
  type?: string;
  description?: string;
  attachments: string[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
