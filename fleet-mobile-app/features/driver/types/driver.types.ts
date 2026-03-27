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
