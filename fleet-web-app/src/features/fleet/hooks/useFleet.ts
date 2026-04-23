import { useQuery } from '@tanstack/react-query';
import { fleetService, type Fleet } from '../services/fleet.service';
import { queryKeys } from '../../../shared/services/queryKeys';

export const useFleet = () => {
  const query = useQuery({
    queryKey: queryKeys.fleet.lists(),
    queryFn: fleetService.getFleets,
  });

  return {
    fleets: (query.data ?? []) as Fleet[],
    isLoading: query.isLoading,
    error: (query.error as Error | null)?.message ?? null,
    refetch: query.refetch,
  };
};
