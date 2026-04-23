import { api } from '../../../shared/services/api';
import type { Vehicle, ApiResponse } from '../../../types';

export type { Vehicle };

export interface MaintenanceRecommendation {
  overview: string;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface MaintenanceRecommendationResponse {
  recommendations: MaintenanceRecommendation[];
}

const normalizePhotos = (photos: unknown): string[] => {
  if (Array.isArray(photos)) {
    return photos.filter((item): item is string => typeof item === 'string' && item.length > 0);
  }

  if (typeof photos !== 'string' || photos.trim().length === 0) {
    return [];
  }

  const value = photos.trim();

  // JSON array string
  if (value.startsWith('[') && value.endsWith(']')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.length > 0);
      }
    } catch {
      // Fallbacks below handle non-JSON representations.
    }
  }

  // Postgres array literal: {url1,url2}
  if (value.startsWith('{') && value.endsWith('}')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((v) => v.trim().replace(/^"|"$/g, ''))
      .filter((v) => v.length > 0);
  }

  // Single URL string
  return [value];
};

const normalizeVehicle = (vehicle: Vehicle): Vehicle => ({
  ...vehicle,
  photos: normalizePhotos((vehicle as unknown as { photos?: unknown }).photos),
});

export const vehiclesService = {
  getVehicles: async (): Promise<Vehicle[]> => {
    const response = await api.get<ApiResponse<Vehicle[]>>('/vehicle/getvehicles');
    return (response.data.data ?? []).map(normalizeVehicle);
  },

  getVehicleById: async (id: string): Promise<Vehicle> => {
    const response = await api.get<ApiResponse<Vehicle>>(`/vehicle/getvehicle/${id}`);
    return normalizeVehicle(response.data.data);
  },

  createVehicle: async (data: Partial<Vehicle> | FormData): Promise<Vehicle> => {
    const response = await api.post<ApiResponse<Vehicle>>('/vehicle/addvehicle', data);
    return normalizeVehicle(response.data.data);
  },

  updateVehicle: async (id: string, data: Partial<Vehicle> | FormData): Promise<Vehicle> => {
    const response = await api.put<ApiResponse<Vehicle>>(
      `/vehicle/updatevehicle/${id}`,
      data
    );
    return normalizeVehicle(response.data.data);
  },

  generateMaintenanceRecommendations: async (id: string): Promise<MaintenanceRecommendation[]> => {
    const response = await api.post<ApiResponse<MaintenanceRecommendationResponse>>(
      `/vehicle/${id}/maintenance-ai`,
    );
    return response.data.data?.recommendations ?? [];
  },

  deleteVehicle: async (id: string): Promise<void> => {
    await api.delete(`/vehicle/deletevehicle/${id}`);
  },
};