import { vehiclesService, type Vehicle } from '../../vehicles/services/vehicles.service';
import { useState, useEffect } from 'react';
import {
  maintenanceService,
  type MaintenanceFilters,
  type PaginationMeta,
} from '../services/maintenance.service';
import type { Maintenance } from '../../../types';

const toApiMessage = (err: unknown, fallback: string) => {
  if (!(err instanceof Object) || !("response" in err)) return fallback;
  const response = (err as { response?: { status?: number; data?: { message?: string } } }).response;
  const status = Number(response?.status);
  const message = response?.data?.message;

  if (status === 422) return message || 'Validation error: please review the form values.';
  if (status === 409) return message || 'Conflict: this operation is not allowed right now.';
  if (status === 404) return message || 'Maintenance record not found.';
  if (status === 401 || status === 403) return message || 'You are not authorized to perform this action.';
  if (status >= 500) return message || 'Server error. Please try again.';

  return message || fallback;
};

export const useMaintenance = (filters: MaintenanceFilters = {}) => {
  const [records, setRecords] = useState<Maintenance[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    totalItems: 0,
    totalPages: 0,
    currentPage: filters.page ?? 1,
    pageSize: filters.limit ?? 10,
  });
  const [upcoming, setUpcoming] = useState<Maintenance[]>([]);
  const [overdue, setOverdue] = useState<(Maintenance & { daysOverdue: number })[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await maintenanceService.getAll(filters);
      setRecords(data.items);
      setMeta(data.meta);
    } catch (err: unknown) {
      setError(toApiMessage(err, 'Failed to fetch maintenances.'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUpcoming = async () => {
    try {
      const data = await maintenanceService.upcoming();
      setUpcoming(data.items);
    } catch {
      setUpcoming([]);
    }
  };

  const fetchOverdue = async () => {
    try {
      const data = await maintenanceService.overdue({ page: 1, limit: 10 });
      setOverdue(data.items);
    } catch {
      setOverdue([]);
    }
  };

  const runAction = async (action: () => Promise<unknown>) => {
    try {
      setError(null);
      await action();
      await Promise.all([fetchRecords(), fetchUpcoming(), fetchOverdue()]);
    } catch (err: unknown) {
      setError(toApiMessage(err, 'Maintenance action failed.'));
      await Promise.all([fetchRecords(), fetchUpcoming(), fetchOverdue()]);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchUpcoming();
    fetchOverdue();
  }, [
    filters.page,
    filters.limit,
    filters.status,
    filters.priority,
    filters.vehicleId,
    filters.technician,
    filters.dateFrom,
    filters.dateTo,
    filters.sortBy,
    filters.sortOrder,
  ]);

  return {
    records,
    meta,
    upcoming,
    overdue,
    isLoading,
    error,
    refetch: fetchRecords,
    startMaintenance: (id: string) =>
      runAction(async () => {
        const current = await maintenanceService.getById(id);
        if (current.status !== 'scheduled' && current.status !== 'pending') {
          setError(`Cannot start maintenance from status '${current.status}'.`);
          return;
        }
        await maintenanceService.start(id);
      }),
    completeMaintenance: (
      id: string,
      data?: { cost?: number; mileage?: number; description?: string; attachments?: string[] }
    ) =>
      runAction(async () => {
        const current = await maintenanceService.getById(id);
        if (current.status !== 'in_progress') {
          setError(`Cannot complete maintenance from status '${current.status}'.`);
          return;
        }
        await maintenanceService.complete(id, data);
      }),
    cancelMaintenance: (id: string) => runAction(() => maintenanceService.cancel(id)),
    updateStatus: (id: string, status: string) => runAction(() => maintenanceService.updateStatus(id, status)),
  };
};



export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await vehiclesService.getVehicles();
      setVehicles(data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch vehicles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  return { vehicles, isLoading, error, refetch: fetchVehicles };
};