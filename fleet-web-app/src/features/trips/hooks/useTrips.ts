import { useState, useEffect } from 'react';
import { mockTrips } from '../../../data/mockData';
import type { Trip } from '../../../types';

export const useTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call with mock data
    const fetchTrips = () => {
      setIsLoading(true);
      setTimeout(() => {
        setTrips(mockTrips);
        setIsLoading(false);
      }, 500);
    };

    fetchTrips();
  }, []);

  return { trips, isLoading, error };
};
