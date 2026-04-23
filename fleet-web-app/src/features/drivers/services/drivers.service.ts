import { api } from '../../../shared/services/api';
import type { Driver, ApiResponse } from '../../../types';

export type { Driver };

export const driversService = {
  getDrivers: async (): Promise<Driver[]> => {
    const response = await api.get<ApiResponse<Driver[]>>('/user/getusers');
    // Backend returns all users — filter to drivers only
    return (response.data.data ?? []).filter(
      (u) => u.role === 'DRIVER',
    );
  },

  getDriverById: async (id: string): Promise<Driver> => {
    const response = await api.get<ApiResponse<Driver>>(`/user/getuser/${id}`);
    return response.data.data;
  },

  createDriver: async (data: Partial<Driver> & { password: string }): Promise<Driver> => {
    
    const response = await api.post<ApiResponse<Driver>>('/user/createdriver', {
      ...data,
      role: 'DRIVER',
    });
    return response.data.data;
  },

  updateDriver: async (id: string, data: Partial<Driver>): Promise<Driver> => {
    const response = await api.put<ApiResponse<Driver>>(`/user/updateuser/${id}`, data);
    return response.data.data;
  },

  uploadDriverAvatar: async (id: string, file: File): Promise<Driver> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.patch<ApiResponse<Driver>>(`/user/${id}/avatar`, formData);
    return response.data.data;
  },

  deleteDriver: async (id: string): Promise<void> => {
    await api.delete(`/user/deleteuser/${id}`);
  },
};
