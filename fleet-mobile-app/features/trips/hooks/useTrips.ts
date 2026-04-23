import { useCallback, useEffect, useState } from "react";
import { tripsApi } from "../services/trips.api";
import type { Trip, TripFilters } from "../types/trip.types";

interface UseTripsState {
  trips: Trip[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTrips(filters?: TripFilters): UseTripsState {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    try {
      setError(null);
      const data = await tripsApi.getAllTrips(filters);
      setTrips(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load trips";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    setIsLoading(true);
    fetchTrips();
  }, [fetchTrips]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchTrips();
  }, [fetchTrips]);

  return {
    trips,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}
