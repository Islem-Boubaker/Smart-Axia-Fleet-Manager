/**
 * Trip feature type definitions
 */

export interface Trip {
  id: string;
  tripNumber: string;
  vehicleId: string;
  driverId: string;
  startLocation: Location;
  endLocation: Location;
  startTime: string;
  endTime?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  distance?: number;
  duration?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripDetails extends Trip {
  // Extended information for detail view
  stepCount?: number;
  currentStep?: number;
  estimatedArrival?: string;
}

export interface Location {
  id: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  type: 'pickup' | 'dropoff';
}

export interface TripFilters {
  status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  vehicleId?: string;
}

export interface CreateTripData {
  startLocationId: string;
  endLocationId: string;
  notes?: string;
}

export interface UpdateTripData {
  status?: string;
  endTime?: string;
  notes?: string;
}
