import { api } from '../../../shared/services/api';
import type { Vehicle } from '../../../types';

export type { Vehicle };

export const vehiclesService = {
  getVehicles: async () => {
    const response = await api.get<Vehicle[]>('/vehicles');
    return response.data;
  },

  getVehicleById: async (id: string) => {
    const response = await api.get<Vehicle>(`/vehicles/${id}`);
    return response.data;
  },

  createVehicle: async (data: Partial<Vehicle>) => {
    const response = await api.post<Vehicle>('/vehicles', data);
    return response.data;
  },

  updateVehicle: async (id: string, data: Partial<Vehicle>) => {
    const response = await api.put<Vehicle>(`/vehicles/${id}`, data);
    return response.data;
  },

  deleteVehicle: async (id: string) => {
    await api.delete(`/vehicles/${id}`);
  },
};
