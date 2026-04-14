import { useState, useEffect } from 'react';
import { tripsService, type PaginationMeta, type TripFilters } from '../services/trips.service';
import type { Trip } from '../../../types';

const buildApiErrorMessage = (err: unknown, fallback: string): string => {
  if (!(err instanceof Object) || !("response" in err)) return fallback;

  const response = (err as { response?: { status?: number; data?: { message?: string; errors?: string[] } } }).response;
  const status = Number(response?.status);
  const message = response?.data?.message;

  if (status === 422) return message || 'Validation error: please check your input.';
  if (status === 409) return message || 'Conflict: operation is not allowed in current state.';
  if (status === 404) return message || 'Requested trip was not found.';
  if (status === 401 || status === 403) return message || 'You are not authorized to perform this action.';
  if (status >= 500) return message || 'Server error. Please try again.';

  return message || fallback;
};

export const useTrips = (filters: TripFilters = {}) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    totalItems: 0,
    totalPages: 0,
    currentPage: filters.page ?? 1,
    pageSize: filters.limit ?? 10,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await tripsService.getTrips(filters);
      setTrips(response.items);
      setMeta(response.meta);
    } catch (err: unknown) {
      setError(buildApiErrorMessage(err, 'Failed to fetch trips.'));
    } finally {
      setIsLoading(false);
    }
  };

  const runAction = async (action: () => Promise<unknown>) => {
    try {
      setError(null);
      await action();
      await fetchTrips();
    } catch (err: unknown) {
      setError(buildApiErrorMessage(err, 'Failed to update trip.'));
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [
    filters.page,
    filters.limit,
    filters.status,
    filters.vehicleId,
    filters.userId,
    filters.region,
    filters.includeStops,
  ]);

  const startTrip = async (id: string) => runAction(() => tripsService.startTrip(id));
  const createTrip = async (data: Partial<Trip>) => {
    try {
      setError(null);
      await tripsService.createTrip(data);
      await fetchTrips();
    } catch (err: unknown) {
      setError(buildApiErrorMessage(err, 'Failed to create trip.'));
      throw err;
    }
  };
  const completeTrip = async (id: string, data?: { endTime?: string; fuel?: string; cost?: number }) =>
    runAction(() => tripsService.completeTrip(id, data));
  const cancelTrip = async (id: string) => runAction(() => tripsService.cancelTrip(id));
  const assignDriver = async (id: string, userId: string) =>
    runAction(() => tripsService.assignDriver(id, userId));
  const unassignDriver = async (id: string) => runAction(() => tripsService.unassignDriver(id));
  const reachStop = async (tripId: string, stopId: string, arrivalTime?: string) =>
    runAction(() => tripsService.reachTripStop(tripId, stopId, arrivalTime));
  const skipStop = async (tripId: string, stopId: string, notes?: string) =>
    runAction(() => tripsService.skipTripStop(tripId, stopId, notes));

  return {
    trips,
    meta,
    isLoading,
    error,
    refetch: fetchTrips,
    createTrip,
    startTrip,
    completeTrip,
    cancelTrip,
    assignDriver,
    unassignDriver,
    reachStop,
    skipStop,
  };
};
