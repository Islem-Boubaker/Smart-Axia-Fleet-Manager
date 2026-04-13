import { tripsApi } from "@/features/trips/services/trips.api";

export const mapsApi = {
  getTripLiveLocation: async (tripId: string) => {
    return tripsApi.getLiveLocation(tripId);
  },

  getTripStops: async (tripId: string) => {
    return tripsApi.getTripStops(tripId);
  },

  sendLocationPing: async (
    tripId: string,
    payload: {
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
      accuracy?: number;
      timestamp?: string;
    },
  ) => {
    return tripsApi.sendLocationPing(tripId, payload);
  },

  reachStop: async (tripId: string, stopId: string, arrivalTime?: string) => {
    return tripsApi.markStopReached(tripId, stopId, arrivalTime);
  },

  skipStop: async (tripId: string, stopId: string, notes?: string) => {
    return tripsApi.markStopSkipped(tripId, stopId, notes);
  },
};
