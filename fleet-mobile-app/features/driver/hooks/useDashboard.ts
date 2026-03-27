import { useState, useEffect, useCallback } from 'react';
import { driverApi } from '../services/driver.api';
import { tripsApi } from '@/features/trips/services/trips.api';
import type { Vehicle, DashboardStats } from '../types/driver.types';
import type { Trip } from '@/features/trips/types/trip.types';

interface DashboardData {
  activeTrip: Trip | null;
  vehicle: Vehicle | null;
  isLoading: boolean;
  isRefreshing: boolean;
  completedCount: number;
  pendingCount: number;
  handleRefresh: () => Promise<void>;
}

/**
 * Hook for managing driver dashboard data
 * Fetches active trips, vehicle info, and statistics
 */
export function useDashboard(): DashboardData {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Load dashboard data on mount
  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch in parallel for better performance
      const [tripData, vehicleData, statsData] = await Promise.all([
        tripsApi.getActiveTrip().catch(() => null),
        driverApi.getAssignedVehicle().catch(() => null),
        driverApi.getDashboardStats().catch(() => null),
      ]);

      setActiveTrip(tripData);
      setVehicle(vehicleData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // Silently fail - components will show default state
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDashboard();

    // Optional: Set up polling for real-time updates
    const interval = setInterval(loadDashboard, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [loadDashboard]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await loadDashboard();
    } finally {
      setIsRefreshing(false);
    }
  }, [loadDashboard]);

  return {
    activeTrip,
    vehicle,
    isLoading,
    isRefreshing,
    completedCount: stats?.completedTrips ?? 0,
    pendingCount: stats?.pendingTrips ?? 0,
    handleRefresh,
  };
}
