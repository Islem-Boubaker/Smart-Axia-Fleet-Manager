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
}

export interface Trip {
  id: string;
  tripNumber: string;
  vehicle: string;
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
