import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tripsService, type CreateTripRequest, type PaginationMeta, type TripFilters } from '../services/trips.service';
import type { Trip } from '../../../types';
import { queryKeys } from '../../../shared/services/queryKeys';

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
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const tripsQuery = useQuery({
    queryKey: queryKeys.trips.list(filters),
    queryFn: () => tripsService.getTrips(filters),
  });

  const runAction = async (action: () => Promise<unknown>) => {
    try {
      setActionError(null);
      await action();
      await queryClient.invalidateQueries({ queryKey: queryKeys.trips.lists() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    } catch (err: unknown) {
      setActionError(buildApiErrorMessage(err, 'Failed to update trip.'));
      throw err;
    }
  };

  const createMutation = useMutation({
    mutationFn: tripsService.createTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
      setActionError(null);
    },
  });

  const startTrip = async (id: string) => runAction(() => tripsService.startTrip(id));
  const createTrip = async (data: CreateTripRequest) => {
    try {
      setActionError(null);
      await createMutation.mutateAsync(data);
    } catch (err: unknown) {
      setActionError(buildApiErrorMessage(err, 'Failed to create trip.'));
      throw err;
    }
  };
  const completeTrip = async (id: string, data?: { endTime?: string; fuel?: number; revenue?: number }) =>
    runAction(() => tripsService.completeTrip(id, data));
  const updateTrip = async (id: string, data: Partial<Trip>) =>
    runAction(() => tripsService.updateTrip(id, data));
  const cancelTrip = async (id: string) => runAction(() => tripsService.cancelTrip(id));
  const assignDriver = async (id: string, userId: string) =>
    runAction(() => tripsService.assignDriver(id, userId));
  const unassignDriver = async (id: string) => runAction(() => tripsService.unassignDriver(id));
  const reachStop = async (tripId: string, stopId: string, arrivalTime?: string) =>
    runAction(() => tripsService.reachTripStop(tripId, stopId, arrivalTime));
  const skipStop = async (tripId: string, stopId: string, notes?: string) =>
    runAction(() => tripsService.skipTripStop(tripId, stopId, notes));

  const fallbackMeta: PaginationMeta = {
    totalItems: 0,
    totalPages: 0,
    currentPage: filters.page ?? 1,
    pageSize: filters.limit ?? 10,
  };

  const isLoading = tripsQuery.isLoading || createMutation.isPending;
  const error = actionError ?? (tripsQuery.error ? buildApiErrorMessage(tripsQuery.error, 'Failed to fetch trips.') : null);

  const sortedTrips = [...(tripsQuery.data?.items ?? [])].sort(
    (a, b) => new Date(b.startTime as string).getTime() - new Date(a.startTime as string).getTime()
  ) as Trip[];

  return {
    trips: sortedTrips,
    meta: tripsQuery.data?.meta ?? fallbackMeta,
    isLoading,
    error,
    refetch: tripsQuery.refetch,
    createTrip,
    updateTrip,
    startTrip,
    completeTrip,
    cancelTrip,
    assignDriver,
    unassignDriver,
    reachStop,
    skipStop,
  };
};
