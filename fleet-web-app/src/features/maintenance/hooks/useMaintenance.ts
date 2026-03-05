import { vehicleService, type Vehicle } from '../../vehicles/services/vehicles.service';
import { useState, useEffect } from 'react';
import { maintenanceService } from '../services/maintenance.service';
import type { Maintenance } from '../../../types';

export const useMaintenance = () => {
  const [records, setRecords] = useState<Maintenance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await maintenanceService.getAll();
      setRecords(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Object && 'response' in err && err.response instanceof Object && 'data' in err.response && err.response.data instanceof Object && 'message' in err.response.data ? (err.response.data as any).message : 'Failed to fetch maintenances';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return {
    records,
    isLoading,
    error,
    refetch: fetchRecords
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
      const data = await vehicleService.getAll();
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