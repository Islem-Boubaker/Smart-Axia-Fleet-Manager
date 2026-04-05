import { api } from '@/shared/services/api';
import type { Vehicle, DashboardStats } from '../types/driver.types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Driver-specific dashboard and vehicle data APIs
 */
export const driverApi = {
  /**
   * Get dashboard overview statistics
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/driver/dashboard/stats');
    return response.data.data;
  },

  /**
   * Get assigned vehicle information
   */
  getAssignedVehicle: async (): Promise<Vehicle> => {
    const response = await api.get<ApiResponse<Vehicle>>('/driver/vehicle');
    return response.data.data;
  },

  /**
   * Update driver location during trip
   */
  updateLocation: async (latitude: number, longitude: number): Promise<{ success: boolean }> => {
    const response = await api.post<ApiResponse<{ success: boolean }>>('/driver/location', {
      latitude,
      longitude,
    });
    return response.data.data;
  },
};
