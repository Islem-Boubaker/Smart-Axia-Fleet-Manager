import { api } from '../../../shared/services/api';
import type { Maintenance } from '../../../types';

export type { Maintenance };
export type MaintenanceRecord = Maintenance;

export const maintenanceService = {
  getMaintenanceRecords: async () => {
    const response = await api.get<MaintenanceRecord[]>('/maintenance');
    return response.data;
  },

  getMaintenanceById: async (id: string) => {
    const response = await api.get<MaintenanceRecord>(`/maintenance/${id}`);
    return response.data;
  },

  createMaintenance: async (data: Partial<MaintenanceRecord>) => {
    const response = await api.post<MaintenanceRecord>('/maintenance', data);
    return response.data;
  },

  updateMaintenance: async (id: string, data: Partial<MaintenanceRecord>) => {
    const response = await api.put<MaintenanceRecord>(`/maintenance/${id}`, data);
    return response.data;
  },

  deleteMaintenance: async (id: string) => {
    await api.delete(`/maintenance/${id}`);
  },
};
