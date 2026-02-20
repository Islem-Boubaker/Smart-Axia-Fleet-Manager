import { useState, useEffect, useCallback } from 'react';
import { mockDrivers } from '../../../data/mockData';
import type { Driver } from '../../../types';

export const useDrivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrivers = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setDrivers(mockDrivers);
      setIsLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const addDriver = useCallback(async (driver: Partial<Driver>) => {
    try {
      // Simulate API call - just add to local state
      const newDriver = { ...driver, id: Date.now().toString() } as Driver;
      setDrivers(prev => [...prev, newDriver]);
    } catch (err: any) {
      setError(err.message || 'Failed to add driver');
      throw err;
    }
  }, []);

  const updateDriver = useCallback(async (id: string, driver: Partial<Driver>) => {
    try {
      // Simulate API call - update local state
      setDrivers(prev => prev.map(d => d.id === id ? { ...d, ...driver } : d));
    } catch (err: any) {
      setError(err.message || 'Failed to update driver');
      throw err;
    }
  }, []);

  const deleteDriver = useCallback(async (id: string) => {
    try {
      // Simulate API call - delete from local state
      setDrivers(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete driver');
      throw err;
    }
  }, []);

  return { drivers, isLoading, error, addDriver, updateDriver, deleteDriver };
};
