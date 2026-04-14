import { api } from '../../../shared/services/api';
import type { Trip, TripStop } from '../../../types';

export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface TripListResponse {
  items: Trip[];
  meta: PaginationMeta;
}

export interface TripFilters {
  page?: number;
  limit?: number;
  status?: string;
  vehicleId?: string;
  userId?: string;
  region?: string;
  includeStops?: boolean;
}

export const tripsService = {
  // Trips Core
  getTrips: async (filters?: TripFilters): Promise<TripListResponse> => {
    const response = await api.get<{ success: boolean; data: any }>('/trips', { params: filters });
    const responseData = response.data.data;

    if (Array.isArray(responseData)) {
      return {
        items: responseData,
        meta: {
          totalItems: responseData.length,
          totalPages: 1,
          currentPage: filters?.page ?? 1,
          pageSize: filters?.limit ?? responseData.length,
        },
      };
    }

    return {
      items: responseData?.data || [],
      meta: responseData?.meta || {
        totalItems: 0,
        totalPages: 0,
        currentPage: filters?.page ?? 1,
        pageSize: filters?.limit ?? 10,
      },
    };
  },

  getTripById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Trip }>(`/trips/${id}`);
    return response.data.data;
  },

  createTrip: async (data: Partial<Trip> & { stops?: Partial<TripStop>[] }) => {
    const response = await api.post<{ success: boolean; data: Trip }>('/trips', data);
    return response.data.data;
  },

  updateTrip: async (id: string, data: Partial<Trip>) => {
    const response = await api.patch<{ success: boolean; data: Trip }>(`/trips/${id}`, data);
    return response.data.data;
  },

  deleteTrip: async (id: string) => {
    await api.delete<{ success: boolean }>(`/trips/${id}`);
  },

  // Trip Lifecycle
  updateTripStatus: async (id: string, status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled') => {
    const response = await api.patch<{ success: boolean; data: Trip }>(`/trips/${id}/status`, { status });
    return response.data.data;
  },

  startTrip: async (id: string) => {
    const response = await api.patch<{ success: boolean; data: Trip }>(`/trips/${id}/start`);
    return response.data.data;
  },

  completeTrip: async (id: string, data?: { endTime?: string; fuel?: string; cost?: number }) => {
    const response = await api.patch<{ success: boolean; data: Trip }>(`/trips/${id}/complete`, data);
    return response.data.data;
  },

  cancelTrip: async (id: string) => {
    const response = await api.patch<{ success: boolean; data: Trip }>(`/trips/${id}/cancel`);
    return response.data.data;
  },

  // Driver Assignment
  assignDriver: async (id: string, userId: string) => {
    const response = await api.post<{ success: boolean; data: Trip }>(`/trips/${id}/assign-driver`, { userId });
    return response.data.data;
  },

  unassignDriver: async (id: string) => {
    const response = await api.post<{ success: boolean; data: Trip }>(`/trips/${id}/unassign-driver`);
    return response.data.data;
  },

  // Trip Stops
  getTripStops: async (tripId: string) => {
    const response = await api.get<{ success: boolean; data: TripStop[] }>(`/trips/${tripId}/stops`);
    return response.data.data;
  },

  addTripStops: async (tripId: string, stops: Partial<TripStop>[]) => {
    const response = await api.post<{ success: boolean; data: TripStop[] }>(`/trips/${tripId}/stops`, { stops });
    return response.data.data;
  },

  updateTripStop: async (tripId: string, stopId: string, data: Partial<TripStop>) => {
    const response = await api.patch<{ success: boolean; data: TripStop }>(`/trips/${tripId}/stops/${stopId}`, data);
    return response.data.data;
  },

  deleteTripStop: async (tripId: string, stopId: string) => {
    await api.delete<{ success: boolean }>(`/trips/${tripId}/stops/${stopId}`);
  },

  reachTripStop: async (tripId: string, stopId: string, arrivalTime?: string) => {
    const response = await api.patch<{ success: boolean; data: TripStop }>(`/trips/${tripId}/stops/${stopId}/reach`, { arrivalTime });
    return response.data.data;
  },

  skipTripStop: async (tripId: string, stopId: string, notes?: string) => {
    const response = await api.patch<{ success: boolean; data: TripStop }>(`/trips/${tripId}/stops/${stopId}/skip`, { notes });
    return response.data.data;
  },

  reorderTripStops: async (tripId: string, orderMap: { stopId: string; stopOrder: number }[]) => {
    const response = await api.patch<{ success: boolean; data: TripStop[] }>(`/trips/${tripId}/stops/reorder`, { order: orderMap });
    return response.data.data;
  },
};
