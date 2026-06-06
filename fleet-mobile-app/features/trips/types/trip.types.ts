export type BackendTripStatus =
  | "scheduled"
  | "ongoing"
  | "completed"
  | "cancelled";
export type UiTripStatus = "pending" | "active" | "completed";

export interface TripStop {
  id: string;
  stopOrder: number;
  locationName: string;
  isDestination?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  status: "pending" | "reached" | "skipped";
  arrivalTime?: string | null;
  estimatedArrival?: string | null;
  notes?: string | null;
}

export interface TripLocation {
  address: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Trip {
  id: string;
  tripNumber: string;
  vehicle: string;
  vehicleId?: string;
  vehicleRecord?: {
    id: string;
    name?: string;
    plaque_immatriculation?: string;
    model?: string;
    Vehicle_Model?: string;
    consumption?: number | null;
  } | null;
  status: UiTripStatus;
  backendStatus?: BackendTripStatus;
  from: string;
  to: string;
  distance: string;
  duration: string;
  date: string;
  score?: number | null;
  lat: number;
  lng: number;

  // Detail screen compatibility
  scheduledTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  fare?: number | null;
  fuel?: string | null;
  pickupLocation: TripLocation;
  destinationLocation: TripLocation;
  startLatitude?: number | null;
  startLongitude?: number | null;
  endLatitude?: number | null;
  endLongitude?: number | null;
  stops?: TripStop[];
}

export interface TripFilters {
  page?: number;
  limit?: number;
  status?: BackendTripStatus;
  vehicleId?: string;
  userId?: string;
  region?: string;
  includeStops?: boolean;
}

export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface TripsListResult {
  items: Trip[];
  meta?: PaginationMeta;
}

export interface TripCompletionPayload {
  endTime?: string;
  fuel?: string;
  cost?: number;
}

export interface TripLocationPingPayload {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp?: string;
}
