import { api } from "@/shared/services/api";
import { formatLocationLabel } from "../utils/locationLabel";
import type {
    Trip,
    TripCompletionPayload,
    TripFilters,
    TripLocationPingPayload,
    TripStop,
    TripsListResult,
} from "../types/trip.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface TripsPaginatedPayload {
  data: BackendTrip[];
  meta?: TripsListResult["meta"];
}

interface BackendTrip {
  id: string;
  tripNumber?: string;
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  region?: string;
  startLocation?: string | { address?: string | null; latitude?: number | string | null; longitude?: number | string | null } | null;
  startLatitude?: number | string | null;
  startLongitude?: number | string | null;
  endLocation?: string | { address?: string | null; latitude?: number | string | null; longitude?: number | string | null } | null;
  endLatitude?: number | string | null;
  endLongitude?: number | string | null;
  startTime?: string;
  endTime?: string;
  distance?: number;
  fuel?: string;
  cost?: number;
  vehicle?: {
    id: string;
    name?: string;
    plaque_immatriculation?: string;
    model?: string;
    Vehicle_Model?: string;
  };
  stops?: TripStop[];
  createdAt?: string;
}

const mapStatusToUi = (status: BackendTrip["status"]): Trip["status"] => {
  if (status === "ongoing") return "active";
  if (status === "completed") return "completed";
  return "pending";
};

const formatDate = (value?: string) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString();
};

const toFiniteNumber = (value: unknown): number | null => {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getLocationAddress = (value: BackendTrip["startLocation"]): string => {
  if (typeof value === "string") return value;
  return String(value?.address ?? "");
};

const getLocationLatitude = (
  value: BackendTrip["startLocation"],
  fallback: unknown,
): number | null => {
  if (value && typeof value === "object") {
    return toFiniteNumber(value.latitude) ?? toFiniteNumber(fallback);
  }
  return toFiniteNumber(fallback);
};

const getLocationLongitude = (
  value: BackendTrip["startLocation"],
  fallback: unknown,
): number | null => {
  if (value && typeof value === "object") {
    return toFiniteNumber(value.longitude) ?? toFiniteNumber(fallback);
  }
  return toFiniteNumber(fallback);
};

const normalizeStop = (stop: TripStop, index: number): TripStop => ({
  ...stop,
  id: String(stop.id ?? index),
  stopOrder: Number.isFinite(Number(stop.stopOrder)) ? Number(stop.stopOrder) : index + 1,
  locationName: formatLocationLabel(stop.locationName),
  latitude: toFiniteNumber(stop.latitude),
  longitude: toFiniteNumber(stop.longitude),
  status: ["pending", "reached", "skipped"].includes(String(stop.status))
    ? stop.status
    : "pending",
});

const toTrip = (item: BackendTrip): Trip => {
  const vehicleLabel =
    item.vehicle?.name ||
    item.vehicle?.model ||
    item.vehicle?.Vehicle_Model ||
    "Assigned vehicle";
  const normalizedStops =
    item.stops?.map((stop, index) => normalizeStop(stop, index)) ?? [];
  const firstStop = normalizedStops[0];
  const startLatitude = getLocationLatitude(item.startLocation, item.startLatitude);
  const startLongitude = getLocationLongitude(item.startLocation, item.startLongitude);
  const endLatitude = getLocationLatitude(item.endLocation, item.endLatitude);
  const endLongitude = getLocationLongitude(item.endLocation, item.endLongitude);
  const startLocationLabel = formatLocationLabel(getLocationAddress(item.startLocation));
  const endLocationLabel = formatLocationLabel(getLocationAddress(item.endLocation));

  return {
    id: item.id,
    tripNumber: item.tripNumber ?? item.id.slice(0, 8).toUpperCase(),
    vehicle: vehicleLabel,
    vehicleId: item.vehicle?.id,
    vehicleRecord: item.vehicle ?? null,
    status: mapStatusToUi(item.status),
    backendStatus: item.status,
    from: startLocationLabel,
    to: endLocationLabel,
    distance: item.distance ? `${item.distance} km` : "",
    duration: "",
    date: formatDate(item.startTime ?? item.createdAt),
    score: null,
    lat: firstStop?.latitude ?? 0,
    lng: firstStop?.longitude ?? 0,
    scheduledTime: item.startTime,
    actualStartTime:
      item.status === "ongoing" || item.status === "completed"
        ? item.startTime
        : undefined,
    actualEndTime: item.endTime,
    fare: item.cost ?? null,
    fuel: item.fuel ?? null,
    startLatitude,
    startLongitude,
    endLatitude,
    endLongitude,
    pickupLocation: {
      address: startLocationLabel,
      city: item.region ?? "",
      latitude: startLatitude,
      longitude: startLongitude,
    },
    destinationLocation: {
      address: endLocationLabel,
      city: item.region ?? "",
      latitude: endLatitude,
      longitude: endLongitude,
    },
    stops: normalizedStops,
  };
};

export const tripsApi = {
  /**
   * Fetch all trips for the current authenticated driver
   */
  getAllTrips: async (filters?: TripFilters): Promise<Trip[]> => {
    const response = await api.get<ApiResponse<TripsPaginatedPayload>>(
      "/trips",
      {
        params: filters,
      },
    );

    const rawTrips = response.data.data?.data ?? [];
    return rawTrips.map(toTrip);
  },

  getTripsWithMeta: async (filters?: TripFilters): Promise<TripsListResult> => {
    const response = await api.get<ApiResponse<TripsPaginatedPayload>>(
      "/trips",
      {
        params: filters,
      },
    );

    return {
      items: (response.data.data?.data ?? []).map(toTrip),
      meta: response.data.data?.meta,
    };
  },

  /**
   * Fetch details of a specific trip
   */
  getTripDetail: async (tripId: string): Promise<Trip> => {
    const response = await api.get<ApiResponse<BackendTrip>>(
      `/trips/${tripId}`,
      {
        params: { includeStops: true },
      },
    );
    return toTrip(response.data.data);
  },

  /**
   * Start a trip
   */
  startTrip: async (tripId: string): Promise<Trip> => {
    const response = await api.patch<ApiResponse<BackendTrip>>(
      `/trips/${tripId}/start`,
      {},
    );
    return toTrip(response.data.data);
  },

  /**
   * Complete a trip with final details
   */
  completeTrip: async (
    tripId: string,
    completion: TripCompletionPayload = {},
  ): Promise<Trip> => {
    const response = await api.patch<ApiResponse<BackendTrip>>(
      `/trips/${tripId}/complete`,
      completion,
    );
    return toTrip(response.data.data);
  },

  endTrip: async (
    tripId: string,
    completion: TripCompletionPayload = {},
  ): Promise<Trip> => {
    return tripsApi.completeTrip(tripId, completion);
  },

  cancelTrip: async (tripId: string): Promise<Trip> => {
    const response = await api.patch<ApiResponse<BackendTrip>>(
      `/trips/${tripId}/cancel`,
      {},
    );
    return toTrip(response.data.data);
  },

  /**
   * Get active trip for the driver
   */
  getActiveTrip: async (): Promise<Trip | null> => {
    const { items } = await tripsApi.getTripsWithMeta({
      status: "ongoing",
      limit: 1,
      includeStops: true,
    });

    return items[0] ?? null;
  },

  getTripStops: async (tripId: string): Promise<TripStop[]> => {
    const response = await api.get<ApiResponse<TripStop[]>>(
      `/trips/${tripId}/stops`,
    );
    return response.data.data;
  },

  markStopReached: async (
    tripId: string,
    stopId: string,
    arrivalTime?: string,
  ): Promise<TripStop> => {
    const response = await api.patch<ApiResponse<TripStop>>(
      `/trips/${tripId}/stops/${stopId}/reach`,
      {
        ...(arrivalTime ? { arrivalTime } : {}),
      },
    );
    return response.data.data;
  },

  markStopSkipped: async (
    tripId: string,
    stopId: string,
    notes?: string,
  ): Promise<TripStop> => {
    const response = await api.patch<ApiResponse<TripStop>>(
      `/trips/${tripId}/stops/${stopId}/skip`,
      {
        ...(notes ? { notes } : {}),
      },
    );
    return response.data.data;
  },

  getLiveLocation: async (tripId: string): Promise<unknown> => {
    const response = await api.get<ApiResponse<unknown>>(
      `/trips/${tripId}/live-location`,
    );
    return response.data.data;
  },

  sendLocationPing: async (
    tripId: string,
    payload: TripLocationPingPayload,
  ): Promise<unknown> => {
    const response = await api.post<ApiResponse<unknown>>(
      `/trips/${tripId}/location-pings`,
      payload,
    );
    return response.data.data;
  },

  getTripHistory: async (tripId: string): Promise<unknown> => {
    const response = await api.get<ApiResponse<unknown>>(
      `/trips/${tripId}/history`,
    );
    return response.data.data;
  },
};
