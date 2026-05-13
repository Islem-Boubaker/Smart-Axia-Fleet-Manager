export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'driver';
  avatar?: string;
}

export interface Vehicle {
  id: string;

  // ── Identity ────────────────────────────────────────────────────────────
  name: string;
  vin?: string;
  plaque_immatriculation?: string;
  brand?: string;
  model?: string;
  year?: number | null;
  photos?: string[];

  // ── Type ────────────────────────────────────────────────────────────────
  /** Frontend UI alias — normalised to vehicle_type by the backend */
  type: 'car' | 'suv' | 'truck' | 'motorcycle' | 'van' | 'bus';
  vehicle_type?: 'Car' | 'SUV' | 'Van' | 'Truck' | 'Bus' | 'Motorcycle';
  /** @deprecated use vehicle_type */
  Vehicle_Model?: 'Car' | 'SUV' | 'Van' | 'Truck' | 'Bus' | 'Motorcycle';

  // ── Status ──────────────────────────────────────────────────────────────
  status: 'AVAILABLE' | 'IN_MAINTENANCE' | 'OUT_OF_SERVICE' | 'ON_TRIP';
  is_active?: boolean;
  /** @deprecated derived from status */
  Active?: boolean;
  /** @deprecated derived from status */
  Need_Maintenance?: boolean;

  // ── Specs ───────────────────────────────────────────────────────────────
  fuel_type?: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'lpg' | null;
  transmission_type?: 'manual' | 'automatic' | 'cvt' | 'dct' | null;
  engine_size?: number | null;
  fuel_efficiency?: number | null;
  capacity?: number | null;
  loadType?: 'general' | 'cold' | 'fragile' | 'heavy';

  // ── Legacy spec aliases ──────────────────────────────────────────────────
  /** @deprecated use engine_size */
  Engine_Size?: number | null;
  /** @deprecated use capacity */
  max_load?: number | null;
  consumption?: number | null;

  // ── Compliance ──────────────────────────────────────────────────────────
  insurance_expiry_date?: string | null;
  tech_visit_expiry_date?: string | null;

  // ── Mileage & Usage ──────────────────────────────────────────────────────
  mileage?: number;
  /** @deprecated use mileage */
  Mileage?: number;
  /** @deprecated use year */
  Vehicle_Age?: number;
  avg_daily_km?: number | null;
  driving_profile?: 'city' | 'highway' | 'mixed' | 'off_road' | null;
  climate_zone?: 'hot_dry' | 'cold' | 'humid' | 'temperate' | null;

  // ── Condition ───────────────────────────────────────────────────────────
  conditionRating?: number;
  tire_age?: number | null;
  brake_age?: number | null;
  battery_status?: number | null;
  accident_count?: number;
  reported_issues_text?: string[];

  // ── Legacy condition aliases ─────────────────────────────────────────────
  /** @deprecated use tire_age */
  Tire_Condition?: 'New' | 'Good' | 'Worn Out';
  /** @deprecated use brake_age */
  Brake_Condition?: 'New' | 'Good' | 'Worn Out';
  /** @deprecated use battery_status */
  Battery_Status?: 'New' | 'Good' | 'Weak';

  // ── Service history ──────────────────────────────────────────────────────
  last_service_date?: string | null;
  last_oil_change_mileage?: number | null;
  last_tire_change_mileage?: number | null;
  last_brake_change_mileage?: number | null;
  last_battery_change_date?: string | null;
  ac_last_service_date?: string | null;
  coolant_last_change_date?: string | null;
  lastMaintenanceDate?: string | null;
  nextMaintenanceDate?: string | null;

  // ── AI ───────────────────────────────────────────────────────────────────
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
  driverScore?: number;
  driverRank?: number;
  experienceBadge?: {
    key: string;
    label: string;
    minTrips: number;
  };
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
  requiredCapacity?: number;
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
  loadType?: 'general' | 'cold' | 'fragile' | 'heavy';
  distance_in_meters?: number;
  estimated_duration_seconds?: number;
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
  reclamationId?: string;
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

// AuthState is now the source of truth in src/store/authSlice.ts
// Re-exported here for backward compatibility.
export type { AuthState } from '../store/authSlice';
