import { useState, useEffect } from 'react';
import { mockVehicles } from '../../../data/mockData';
import type { Vehicle } from '../../../types';

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call with mock data
    const fetchVehicles = () => {
      setIsLoading(true);
      setTimeout(() => {
        setVehicles(mockVehicles);
        setIsLoading(false);
      }, 500);
    };

    fetchVehicles();
  }, []);

  return { vehicles, isLoading, error };
};
