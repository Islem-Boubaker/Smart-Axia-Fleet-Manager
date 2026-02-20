import { useState, useEffect } from 'react';
import { mockMaintenance } from '../../../data/mockData';
import type { Maintenance } from '../../../types';

export const useMaintenance = () => {
  const [records, setRecords] = useState<Maintenance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call with mock data
    const fetchRecords = () => {
      setIsLoading(true);
      setTimeout(() => {
        setRecords(mockMaintenance);
        setIsLoading(false);
      }, 500);
    };

    fetchRecords();
  }, []);

  return { records, isLoading, error };
};
