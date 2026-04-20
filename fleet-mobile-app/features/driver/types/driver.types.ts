/**
 * Driver feature type definitions
 */

export interface Vehicle {
  id: string;
  licensePlate: string;
  model: string;
  manufacturer: string;
  year: number;
  color: string;
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  mileage: number;
  status: 'active' | 'maintenance' | 'inactive';
  lastMaintenanceDate?: string;
}

export interface DashboardStats {
  completedTrips: number;
  pendingTrips: number;
  totalDistance: number;
  totalHours: number;
  averageRating?: number;
}

export interface DriverProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  profilePhoto?: string;
  totalTrips: number;
  rating: number;
  joinDate: string;
  status: 'active' | 'inactive' | 'suspended';
}

export type DashboardTripStatus =
  | "scheduled"
  | "ongoing"
  | "completed"
  | "cancelled";

export interface TripStop {
  id: string;
  tripId?: string;
  locationName?: string;
  latitude?: number | null;
  longitude?: number | null;
  status?: "pending" | "reached" | "skipped";
  stopOrder?: number;
}

export interface Trip {
  id: string;
  userId?: string;
  vehicleId?: string;
  region?: string;
  startLocation: string;
  endLocation: string;
  startTime?: string;
  endTime?: string;
  distance?: number;
  fuel?: string;
  cost?: number;
  status: DashboardTripStatus;
  stops: TripStop[];
}

import type { User } from "@/features/auth/types/auth.types";

export interface DashboardData {
  user: (User & { assignedVehicle?: string | null }) | null;
  activeTrip: Trip | null;
  upcomingTrip: Trip | null;
  recentTrips: Trip[];
  completedCount: number;
  pendingCount: number;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
