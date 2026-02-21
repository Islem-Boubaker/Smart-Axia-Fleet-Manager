import { api } from '../../../shared/services/api';
import type { Trip } from '../../../types';

export type { Trip };

export const tripsService = {
  getTrips: async () => {
    const response = await api.get<Trip[]>('/trips');
    return response.data;
  },

  getTripById: async (id: string) => {
    const response = await api.get<Trip>(`/trips/${id}`);
    return response.data;
  },

  createTrip: async (data: Partial<Trip>) => {
    const response = await api.post<Trip>('/trips', data);
    return response.data;
  },

  updateTrip: async (id: string, data: Partial<Trip>) => {
    const response = await api.put<Trip>(`/trips/${id}`, data);
    return response.data;
  },

  deleteTrip: async (id: string) => {
    await api.delete(`/trips/${id}`);
  },
};
