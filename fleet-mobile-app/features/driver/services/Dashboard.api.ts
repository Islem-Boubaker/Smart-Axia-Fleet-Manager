import { tripsApi } from "@/features/trips/services/trips.api";
import { api } from "@/shared/services/api";
import type { DashboardStats, Vehicle } from "../types/driver.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Driver-specific dashboard and vehicle data APIs
 */
export const driverApi = {
  /**
   * Get dashboard overview statistics from documented driver-visible trips endpoint.
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    const { items } = await tripsApi.getTripsWithMeta({ limit: 100 });

    const completedTrips = items.filter(
      (trip) => trip.backendStatus === "completed",
    ).length;
    const pendingTrips = items.filter(
      (trip) =>
        trip.backendStatus === "scheduled" || trip.backendStatus === "ongoing",
    ).length;

    const totalDistance = items.reduce((sum, trip) => {
      const numeric = Number((trip.distance || "").replace(/[^0-9.]/g, ""));
      return sum + (Number.isFinite(numeric) ? numeric : 0);
    }, 0);

    return {
      completedTrips,
      pendingTrips,
      totalDistance,
      totalHours: 0,
    };
  },

  /**
   * Infer assigned vehicle from ongoing/scheduled driver trips.
   */
  getAssignedVehicle: async (): Promise<Vehicle | null> => {
    const { items } = await tripsApi.getTripsWithMeta({
      includeStops: false,
      limit: 1,
      status: "ongoing",
    });

    const candidate =
      items[0] ??
      (await tripsApi.getTripsWithMeta({ limit: 1, status: "scheduled" }))
        .items[0];
    if (!candidate) return null;

    return {
      id: candidate.id,
      licensePlate: candidate.vehicle,
      model: candidate.vehicle,
      manufacturer: "Unknown",
      year: 0,
      color: "Unknown",
      fuelType: "diesel",
      mileage: 0,
      status: candidate.backendStatus === "cancelled" ? "inactive" : "active",
    };
  },

  /**
   * Record driver location ping to the documented endpoint.
   */
  updateLocation: async (
    tripId: string,
    latitude: number,
    longitude: number,
  ): Promise<unknown> => {
    const response = await api.post<ApiResponse<unknown>>(
      `/trips/${tripId}/location-pings`,
      {
        latitude,
        longitude,
      },
    );
    return response.data.data;
  },
};
