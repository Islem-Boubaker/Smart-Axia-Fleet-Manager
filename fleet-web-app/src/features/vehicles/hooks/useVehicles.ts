import { useState, useEffect, useCallback } from 'react';
import { vehiclesService } from '../services/vehicles.service';
import type { Vehicle } from '../../../types';

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await vehiclesService.getVehicles();
      setVehicles(data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to fetch vehicles';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchVehicles();
    return () => controller.abort(); // prevents StrictMode double-fetch side effects
  }, [fetchVehicles]);

  const createVehicle = useCallback(async (data: Partial<Vehicle>) => {
    const created = await vehiclesService.createVehicle(data);
    setVehicles((prev) => [...prev, created]);
    return created;
  }, []);

  const updateVehicle = useCallback(async (id: string, data: Partial<Vehicle>) => {
    const updated = await vehiclesService.updateVehicle(id, data);
    setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));
    return updated;
  }, []);

  const deleteVehicle = useCallback(async (id: string) => {
    await vehiclesService.deleteVehicle(id);
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  }, []);

  return { vehicles, isLoading, error, fetchVehicles, createVehicle, updateVehicle, deleteVehicle };
};