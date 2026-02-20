import { api } from '../../../shared/services/api';
import type { Driver } from '../../../types';

export type { Driver };

export const driversService = {
  getDrivers: async () => {
    const response = await api.get<Driver[]>('/drivers');
    return response.data;
  },

  getDriverById: async (id: string) => {
    const response = await api.get<Driver>(`/drivers/${id}`);
    return response.data;
  },

  createDriver: async (data: Partial<Driver>) => {
    const response = await api.post<Driver>('/drivers', data);
    return response.data;
  },

  updateDriver: async (id: string, data: Partial<Driver>) => {
    const response = await api.put<Driver>(`/drivers/${id}`, data);
    return response.data;
  },

  deleteDriver: async (id: string) => {
    await api.delete(`/drivers/${id}`);
  },
};
