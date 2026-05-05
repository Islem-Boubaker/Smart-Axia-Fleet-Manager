export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },

  vehicles: {
    all: ['vehicles'] as const,
    lists: () => [...queryKeys.vehicles.all, 'list'] as const,
    list: (filters?: unknown) => [...queryKeys.vehicles.lists(), filters] as const,
    details: () => [...queryKeys.vehicles.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.vehicles.details(), id] as const,
  },

  trips: {
    all: ['trips'] as const,
    lists: () => [...queryKeys.trips.all, 'list'] as const,
    list: (filters?: unknown) => [...queryKeys.trips.lists(), filters] as const,
    details: () => [...queryKeys.trips.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.trips.details(), id] as const,
    stops: (tripId: string) => [...queryKeys.trips.detail(tripId), 'stops'] as const,
  },

  maintenance: {
    all: ['maintenance'] as const,
    lists: () => [...queryKeys.maintenance.all, 'list'] as const,
    list: (filters?: unknown) => [...queryKeys.maintenance.lists(), filters] as const,
    details: () => [...queryKeys.maintenance.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.maintenance.details(), id] as const,
    upcoming: (days?: number) => [...queryKeys.maintenance.all, 'upcoming', days] as const,
    overdue: (filters?: unknown) => [...queryKeys.maintenance.all, 'overdue', filters] as const,
  },

  drivers: {
    all: ['drivers'] as const,
    lists: () => [...queryKeys.drivers.all, 'list'] as const,
    list: (filters?: unknown) => [...queryKeys.drivers.lists(), filters] as const,
    details: () => [...queryKeys.drivers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.drivers.details(), id] as const,
    leaderboard: (limit?: number) => [...queryKeys.drivers.all, 'leaderboard', limit] as const,
    ranking: () => [...queryKeys.drivers.all, 'ranking'] as const,
  },

  fleet: {
    all: ['fleet'] as const,
    lists: () => [...queryKeys.fleet.all, 'list'] as const,
  },

  reclamations: {
    all: ['reclamations'] as const,
    lists: () => [...queryKeys.reclamations.all, 'list'] as const,
    list: (filters?: unknown) => [...queryKeys.reclamations.lists(), filters] as const,
    my: () => [...queryKeys.reclamations.all, 'my'] as const,
    details: () => [...queryKeys.reclamations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.reclamations.details(), id] as const,
  },

  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    recentTrips: (limit?: number) => [...queryKeys.dashboard.all, 'recentTrips', limit] as const,
    recentVehicles: (limit?: number) => [...queryKeys.dashboard.all, 'recentVehicles', limit] as const,
    alerts: () => [...queryKeys.dashboard.all, 'alerts'] as const,
  },

  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters?: unknown) => [...queryKeys.notifications.lists(), filters] as const,
    grouped: () => [...queryKeys.notifications.all, 'grouped'] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'] as const,
  },

  reports: {
    all: ['reports'] as const,
    overview: (filters?: unknown) => [...queryKeys.reports.all, 'overview', filters] as const,
    drivers: (filters?: unknown) => [...queryKeys.reports.all, 'drivers', filters] as const,
    vehicles: (filters?: unknown) => [...queryKeys.reports.all, 'vehicles', filters] as const,
    fuel: (filters?: unknown) => [...queryKeys.reports.all, 'fuel', filters] as const,
  },

  settings: {
    all: ['settings'] as const,
    profile: () => [...queryKeys.settings.all, 'profile'] as const,
    notifications: () => [...queryKeys.settings.all, 'notifications'] as const,
  },
} as const
