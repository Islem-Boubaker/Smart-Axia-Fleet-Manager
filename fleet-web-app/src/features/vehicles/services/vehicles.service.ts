import { api } from '../../../shared/services/api';
import type { Vehicle, ApiResponse } from '../../../types';

export type { Vehicle };

export const vehiclesService = {
  getVehicles: async (): Promise<Vehicle[]> => {
    const response = await api.get<ApiResponse<Vehicle[]>>('/vehicle/getvehicles');
    return response.data.data;
  },

  getVehicleById: async (id: string): Promise<Vehicle> => {
    const response = await api.get<ApiResponse<Vehicle>>(`/vehicle/getvehicle/${id}`);
    return response.data.data;
  },

  createVehicle: async (data: Partial<Vehicle> | FormData): Promise<Vehicle> => {
    const response = await api.post<ApiResponse<Vehicle>>('/vehicle/addvehicle', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data.data;
  },

  updateVehicle: async (id: string, data: Partial<Vehicle> | FormData): Promise<Vehicle> => {
    const response = await api.put<ApiResponse<Vehicle>>(
      `/vehicle/updatevehicle/${id}`,
      data,
      {
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
      }
    );
    return response.data.data;
  },

  deleteVehicle: async (id: string): Promise<void> => {
    await api.delete(`/vehicle/deletevehicle/${id}`);
  },
};