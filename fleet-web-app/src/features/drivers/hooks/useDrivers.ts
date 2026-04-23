import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { driversService } from '../services/drivers.service';
import type { Driver } from '../../../types';
import { queryKeys } from '../../../shared/services/queryKeys';

export const useDrivers = () => {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const driversQuery = useQuery({
    queryKey: queryKeys.drivers.lists(),
    queryFn: driversService.getDrivers,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { driverData: Partial<Driver> & { password: string }; photo?: File | null }) => {
      let created = await driversService.createDriver(payload.driverData);
      if (payload.photo && created.id) {
        created = await driversService.uploadDriverAvatar(created.id, payload.photo);
      }
      return created;
    },
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.lists() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; driverData: Partial<Driver>; photo?: File | null }) => {
      let updated = await driversService.updateDriver(payload.id, payload.driverData);
      if (payload.photo) {
        updated = await driversService.uploadDriverAvatar(payload.id, payload.photo);
      }
      return updated;
    },
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.lists() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: driversService.deleteDriver,
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.lists() });
    },
  });

  const getErrorMessage = (err: unknown, fallback: string) => {
    const maybeErr = err as { response?: { data?: { message?: string } }; message?: string };
    return maybeErr.response?.data?.message || maybeErr.message || fallback;
  };

  const addDriver = useCallback(async (driverData: Partial<Driver> & { password: string }, photo?: File | null) => {
    try {
      const newDriver = await createMutation.mutateAsync({ driverData, photo });
      return newDriver;
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Failed to add driver');
      setActionError(msg);
      throw new Error(msg);
    }
  }, [createMutation]);

  const updateDriver = useCallback(async (id: string, driverData: Partial<Driver>, photo?: File | null) => {
    try {
      const updated = await updateMutation.mutateAsync({ id, driverData, photo });
      return updated;
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Failed to update driver');
      setActionError(msg);
      throw new Error(msg);
    }
  }, [updateMutation]);

  const deleteDriver = useCallback(async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Failed to delete driver');
      setActionError(msg);
      throw new Error(msg);
    }
  }, [deleteMutation]);

  const isLoading = driversQuery.isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const queryError = (driversQuery.error as Error | null)?.message ?? null;

  return {
    drivers: driversQuery.data ?? [],
    isLoading,
    error: actionError ?? queryError,
    fetchDrivers: driversQuery.refetch,
    addDriver,
    updateDriver,
    deleteDriver,
  };
};
