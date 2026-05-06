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
  startLocation: string;
  startLatitude?: number | null;
  startLongitude?: number | null;
  endLocation: string;
  endLatitude?: number | null;
  endLongitude?: number | null;
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

const toTrip = (item: BackendTrip): Trip => {
  const vehicleLabel =
    item.vehicle?.name ||
    item.vehicle?.model ||
    item.vehicle?.Vehicle_Model ||
    "Assigned vehicle";
  const normalizedStops =
    item.stops?.map((stop) => ({
      ...stop,
      locationName: formatLocationLabel(stop.locationName),
    })) ?? [];
  const firstStop = normalizedStops[0];
  const startLocationLabel = formatLocationLabel(item.startLocation);
  const endLocationLabel = formatLocationLabel(item.endLocation);

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
    startLatitude: item.startLatitude ?? null,
    startLongitude: item.startLongitude ?? null,
    endLatitude: item.endLatitude ?? null,
    endLongitude: item.endLongitude ?? null,
    pickupLocation: {
      address: startLocationLabel,
      city: item.region ?? "",
      latitude: item.startLatitude ?? null,
      longitude: item.startLongitude ?? null,
    },
    destinationLocation: {
      address: endLocationLabel,
      city: item.region ?? "",
      latitude: item.endLatitude ?? null,
      longitude: item.endLongitude ?? null,
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
