import { useState, useEffect } from 'react';
import { fleetService, type Fleet } from '../services/fleet.service';

export const useFleet = () => {
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFleets = async () => {
      try {
        setIsLoading(true);
        const data = await fleetService.getFleets();
        setFleets(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch fleets');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFleets();
  }, []);

  return { fleets, isLoading, error };
};
