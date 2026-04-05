import { useState, useEffect, useCallback } from 'react';
import { driversService } from '../services/drivers.service';
import type { Driver } from '../../../types';

export const useDrivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrivers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await driversService.getDrivers();
  
      setDrivers(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch drivers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const addDriver = useCallback(async (driverData: Partial<Driver> & { password: string }) => {
    try {
      const newDriver = await driversService.createDriver(driverData);
      setDrivers(prev => [...prev, newDriver]);
      return newDriver;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to add driver';
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const updateDriver = useCallback(async (id: string, driverData: Partial<Driver>) => {
    try {
      const updated = await driversService.updateDriver(id, driverData);
      setDrivers(prev => prev.map(d => (d.id === id ? updated : d)));
      return updated;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update driver';
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const deleteDriver = useCallback(async (id: string) => {
    try {
      await driversService.deleteDriver(id);
      setDrivers(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete driver';
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  return { drivers, isLoading, error, fetchDrivers, addDriver, updateDriver, deleteDriver };
};
