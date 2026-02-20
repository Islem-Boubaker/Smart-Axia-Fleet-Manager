import { api } from '../../../shared/services/api';

export interface Fleet {
  id: string;
  name: string;
  description: string;
  vehicleCount: number;
  totalMileage: number;
}

export const fleetService = {
  getFleets: async () => {
    const response = await api.get<Fleet[]>('/fleets');
    return response.data;
  },

  getFleetById: async (id: string) => {
    const response = await api.get<Fleet>(`/fleets/${id}`);
    return response.data;
  },

  createFleet: async (data: Partial<Fleet>) => {
    const response = await api.post<Fleet>('/fleets', data);
    return response.data;
  },

  updateFleet: async (id: string, data: Partial<Fleet>) => {
    const response = await api.put<Fleet>(`/fleets/${id}`, data);
    return response.data;
  },

  deleteFleet: async (id: string) => {
    await api.delete(`/fleets/${id}`);
  },
};
