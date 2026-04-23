import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from './queryKeys'

export const cacheInvalidation = {
  onVehicleCreate: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.lists() })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentVehicles() })
  },

  onVehicleUpdate: (queryClient: QueryClient, vehicleId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.detail(vehicleId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.lists() })
  },

  onVehicleDelete: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.lists() })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
  },

  onTripCreate: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.trips.lists() })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentTrips() })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
  },

  onTripComplete: (queryClient: QueryClient, tripId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(tripId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.trips.lists() })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.all })
  },

  onMaintenanceCreate: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.lists() })
    queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.upcoming() })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
  },

  refreshAll: (queryClient: QueryClient) => {
    queryClient.invalidateQueries()
  },
}
