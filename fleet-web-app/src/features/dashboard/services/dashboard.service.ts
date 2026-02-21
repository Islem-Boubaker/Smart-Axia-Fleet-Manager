import { api } from '../../../shared/services/api';

export interface DashboardStats {
  totalVehicles: number;
  activeDrivers: number;
  ongoingTrips: number;
  totalDistance: string;
}

export interface RecentVehicle {
  id: string;
  name: string;
  plate: string;
  status: string;
  driver: string;
}

export interface RecentTrip {
  id: string;
  driver: string;
  vehicle: string;
  from: string;
  to: string;
  status: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentVehicles: RecentVehicle[];
  recentTrips: RecentTrip[];
}

export const dashboardService = {
  getDashboardData: async (): Promise<DashboardData> => {
    const response = await api.get<DashboardData>('/dashboard');
    return response.data;
  },

  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },

  getRecentVehicles: async (limit: number = 5): Promise<RecentVehicle[]> => {
    const response = await api.get<RecentVehicle[]>(`/dashboard/recent-vehicles?limit=${limit}`);
    return response.data;
  },

  getRecentTrips: async (limit: number = 5): Promise<RecentTrip[]> => {
    const response = await api.get<RecentTrip[]>(`/dashboard/recent-trips?limit=${limit}`);
    return response.data;
  },
};
