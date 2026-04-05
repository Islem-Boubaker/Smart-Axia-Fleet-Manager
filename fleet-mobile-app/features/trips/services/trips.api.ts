import { api } from '@/shared/services/api';
import type { Trip, TripFilters, TripDetails } from '../types/trip.types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const tripsApi = {
  /**
   * Fetch all trips for the current authenticated driver
   */
  getAllTrips: async (filters?: TripFilters): Promise<Trip[]> => {
    const response = await api.get<ApiResponse<Trip[]>>('/trips', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Fetch details of a specific trip
   */
  getTripDetail: async (tripId: string): Promise<TripDetails> => {
    const response = await api.get<ApiResponse<TripDetails>>(`/trips/${tripId}`);
    return response.data.data;
  },

  /**
   * Start a trip
   */
  startTrip: async (tripId: string): Promise<Trip> => {
    const response = await api.post<ApiResponse<Trip>>(`/trips/${tripId}/start`, {});
    return response.data.data;
  },

  /**
   * Complete a trip with final details
   */
  completeTrip: async (tripId: string, completion: { notes?: string }): Promise<Trip> => {
    const response = await api.post<ApiResponse<Trip>>(`/trips/${tripId}/complete`, completion);
    return response.data.data;
  },

  /**
   * Get active trip for the driver
   */
  getActiveTrip: async (): Promise<Trip | null> => {
    const response = await api.get<ApiResponse<Trip | null>>('/trips/active');
    return response.data.data;
  },
};
