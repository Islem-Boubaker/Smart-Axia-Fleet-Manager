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

const booleanFrom = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on', 'active', 'available'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n', 'off', 'inactive', 'out_of_service'].includes(normalized)) return false;
  }
  return fallback;
};

const normalizeStatus = (value: unknown): Vehicle['status'] => {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase().replace(/[-\s]+/g, '_') : '';
  if (normalized === 'IN_MAINTENANCE' || normalized === 'MAINTENANCE') return 'IN_MAINTENANCE';
  if (normalized === 'OUT_OF_SERVICE' || normalized === 'INACTIVE') return 'OUT_OF_SERVICE';
  if (normalized === 'ON_TRIP' || normalized === 'IN_USE') return 'ON_TRIP';
  return 'AVAILABLE';
};

const normalizeVehicleType = (value: unknown): Vehicle['type'] => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (normalized === 'suv' || normalized === 'truck' || normalized === 'motorcycle' || normalized === 'van') {
    return normalized;
  }
  return 'car';
};

const statusFromLegacy = (vehicle: Record<string, unknown>): Vehicle['status'] => {
  const needsMaintenance = booleanFrom(
    vehicle.Need_Maintenance ?? vehicle.need_maintenance ?? vehicle.needMaintenance ?? vehicle.needsMaintenance,
    false,
  );
  if (needsMaintenance) return 'IN_MAINTENANCE';

  const active = booleanFrom(vehicle.Active ?? vehicle.active ?? vehicle.is_active, true);
  return active ? 'AVAILABLE' : 'OUT_OF_SERVICE';
};

const normalizeVehicle = (vehicle: Vehicle): Vehicle => {
  const raw = vehicle as unknown as Record<string, unknown>;
  const hasExplicitStatus = typeof raw.status === 'string' && raw.status.trim().length > 0;
  const status = hasExplicitStatus ? normalizeStatus(raw.status) : statusFromLegacy(raw);
  const active = status !== 'OUT_OF_SERVICE';
  const needsMaintenance = status === 'IN_MAINTENANCE';

  return {
    ...vehicle,
    status,
    Active: active,
    Need_Maintenance: needsMaintenance,
    type: normalizeVehicleType(raw.type ?? raw.vehicle_type),
    Vehicle_Model: (raw.Vehicle_Model ?? raw.vehicle_type ?? vehicle.Vehicle_Model ?? 'Car') as Vehicle['Vehicle_Model'],
    photos: normalizePhotos(raw.photos),
  };
};

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
