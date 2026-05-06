import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vehiclesService } from '../services/vehicles.service';
import { tripsService } from '../../trips/services/trips.service';
import { maintenanceService } from '../../maintenance/services/maintenance.service';
import type { Maintenance, Trip, Vehicle } from '../../../types';
import { queryKeys } from '../../../shared/services/queryKeys';
import { getVehicleStatusLabel, type VehicleStatusLabel } from '../utils/vehicleStatus';

export type VehicleStatusFilter = 'all' | 'available' | 'in_use' | 'maintenance' | 'inactive';
export type VehicleTypeFilter = Vehicle['type'] | 'all';
export type { VehicleStatusLabel };

export interface MaintenanceRecommendation {
  overview: string;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface MaintenanceRecommendationPayload {
  recommendations: MaintenanceRecommendation[];
}

export interface VehicleAssignmentSummary {
  driverName: string;
  tripStatus: Trip['status'];
  startLocation: string;
  endLocation: string;
  startTime?: string;
}

export interface VehicleTableRow {
  vehicle: Vehicle;
  statusLabel: VehicleStatusLabel;
  driverName: string;
  lastTripLabel: string;
  lastTripTime?: string;
  currentAssignment: VehicleAssignmentSummary | null;
  maintenanceHistory: Maintenance[];
  maintenanceRecommendations: MaintenanceRecommendation[];
}

const getErrorMessage = (err: unknown, fallback: string): string => {
  const maybeMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
  if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) return maybeMessage;
  return fallback;
};

const toTimestamp = (value?: string): number => {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const matchesVehicleTrip = (vehicle: Vehicle, trip: Trip): boolean => {
  if (trip.vehicleId && trip.vehicleId === vehicle.id) return true;
  if (trip.vehicle?.id && trip.vehicle.id === vehicle.id) return true;

  const plate = (vehicle.plaque_immatriculation ?? '').trim().toLowerCase();
  const tripPlate = (trip.vehicle?.plaque_immatriculation ?? '').trim().toLowerCase();
  return plate.length > 0 && plate === tripPlate;
};

const matchesVehicleMaintenance = (vehicle: Vehicle, maintenance: Maintenance): boolean => {
  if (maintenance.vehicleId && maintenance.vehicleId === vehicle.id) return true;

  const plate = (vehicle.plaque_immatriculation ?? '').trim().toLowerCase();
  const maintenancePlate = (maintenance.vehiclePlate ?? '').trim().toLowerCase();
  return plate.length > 0 && plate === maintenancePlate;
};

const formatTripLabel = (date?: string): string => {
  if (!date) return 'No trips';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'No trips';

  const now = Date.now();
  const diffMs = now - parsed.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return `Today, ${parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return parsed.toLocaleDateString();
};

const applyMaintenanceRecommendationsToVehicle = (
  vehicle: Vehicle,
  recommendations: MaintenanceRecommendation[],
): Vehicle => ({
  ...vehicle,
  maintenance_recommandation_ai: {
    recommendations,
  } as MaintenanceRecommendationPayload,
});

const isMaintenanceLevel = (value: unknown): value is MaintenanceRecommendation['level'] => {
  return value === 'HIGH' || value === 'MEDIUM' || value === 'LOW';
};

const normalizeMaintenanceRecommendation = (value: unknown): MaintenanceRecommendation | null => {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as { overview?: unknown; level?: unknown };
  const overview = typeof candidate.overview === 'string' ? candidate.overview.trim() : '';
  const level = isMaintenanceLevel(candidate.level) ? candidate.level : null;

  if (overview.length === 0 || !level) return null;

  return {
    overview,
    level,
  };
};

export const parseMaintenanceRecommendation = (vehicle: Vehicle): MaintenanceRecommendation[] => {
  const rawValue = vehicle.maintenance_recommandation_ai;

  const parsedValue = (() => {
    if (rawValue == null) return null;

    if (typeof rawValue === 'string') {
      const trimmed = rawValue.trim();
      if (trimmed.length === 0) return null;

      try {
        return JSON.parse(trimmed) as unknown;
      } catch {
        return null;
      }
    }

    return rawValue;
  })();

  if (!parsedValue || typeof parsedValue !== 'object') return [];

  if (Array.isArray(parsedValue)) {
    return parsedValue
      .map(normalizeMaintenanceRecommendation)
      .filter((item): item is MaintenanceRecommendation => item !== null);
  }

  const candidate = parsedValue as { recommendations?: unknown };
  const recommendations = candidate.recommendations;

  if (!Array.isArray(recommendations)) {
    const singleRecommendation = normalizeMaintenanceRecommendation(parsedValue);
    return singleRecommendation ? [singleRecommendation] : [];
  }

  return recommendations
    .map(normalizeMaintenanceRecommendation)
    .filter((item): item is MaintenanceRecommendation => item !== null);
};

export const useVehicles = () => {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<VehicleTypeFilter>('all');

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const vehiclesQuery = useQuery({
    queryKey: queryKeys.vehicles.lists(),
    queryFn: vehiclesService.getVehicles,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const tripsQuery = useQuery({
    queryKey: queryKeys.trips.list({ page: 1, limit: 300 }),
    queryFn: () => tripsService.getTrips({ page: 1, limit: 300 }),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const maintenanceQuery = useQuery({
    queryKey: queryKeys.maintenance.list({ page: 1, limit: 300 }),
    queryFn: () => maintenanceService.getAll({ page: 1, limit: 300 }),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const selectedVehicleDetailsQuery = useQuery({
    queryKey: queryKeys.vehicles.detail(selectedVehicleId ?? ''),
    queryFn: () => vehiclesService.getVehicleById(selectedVehicleId as string),
    enabled: Boolean(selectedVehicleId),
  });

  const createVehicleMutation = useMutation({
    mutationFn: vehiclesService.createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.recentVehicles() });
    },
  });

  const updateVehicleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Vehicle> | FormData }) =>
      vehiclesService.updateVehicle(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });

  const generateMaintenanceRecommendationsMutation = useMutation({
    mutationFn: (vehicleId: string) => vehiclesService.generateMaintenanceRecommendations(vehicleId),
    onSuccess: (recommendations, vehicleId) => {
      queryClient.setQueryData<Vehicle | undefined>(
        queryKeys.vehicles.detail(vehicleId),
        (currentVehicle) =>
          currentVehicle
            ? applyMaintenanceRecommendationsToVehicle(currentVehicle, recommendations)
            : currentVehicle,
      );

      queryClient.setQueriesData<Vehicle[]>({ queryKey: queryKeys.vehicles.lists() }, (currentVehicles) => {
        if (!currentVehicles) return currentVehicles;

        return currentVehicles.map((vehicle) =>
          vehicle.id === vehicleId
            ? applyMaintenanceRecommendationsToVehicle(vehicle, recommendations)
            : vehicle,
        );
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.detail(vehicleId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.lists() });
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: vehiclesService.deleteVehicle,
    onSuccess: (_data, vehicleId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
      if (selectedVehicleId === vehicleId) {
        setSelectedVehicleId(null);
      }
    },
  });

  const vehicles = useMemo(() => vehiclesQuery.data ?? [], [vehiclesQuery.data]);
  const trips = useMemo(() => tripsQuery.data?.items ?? [], [tripsQuery.data?.items]);
  const maintenanceRecords = useMemo(
    () => maintenanceQuery.data?.items ?? [],
    [maintenanceQuery.data?.items],
  );
  const isLoading =
    vehiclesQuery.isLoading ||
    tripsQuery.isLoading ||
    maintenanceQuery.isLoading ||
    createVehicleMutation.isPending ||
    updateVehicleMutation.isPending ||
    deleteVehicleMutation.isPending;

  const queryError = vehiclesQuery.error || tripsQuery.error || maintenanceQuery.error;
  const error = queryError ? getErrorMessage(queryError, 'Failed to fetch vehicles') : null;

  const fetchVehicles = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.lists() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all }),
    ]);
  }, [queryClient]);

  const vehicleRows = useMemo<VehicleTableRow[]>(() => {
    return vehicles.map((vehicle) => {
      const relatedTrips = trips
        .filter((trip) => matchesVehicleTrip(vehicle, trip))
        .sort((a, b) => toTimestamp(b.startTime) - toTimestamp(a.startTime));

      const activeTrip = relatedTrips.find((trip) => trip.status === 'ongoing');
      const latestTrip = relatedTrips[0];

      const driverName =
        activeTrip?.driver?.name || latestTrip?.driver?.name || 'Unassigned';

      const currentAssignment: VehicleAssignmentSummary | null = activeTrip
        ? {
            driverName: activeTrip.driver?.name || 'Unassigned',
            tripStatus: activeTrip.status,
            startLocation: activeTrip.startLocation,
            endLocation: activeTrip.endLocation,
            startTime: activeTrip.startTime,
          }
        : null;

      const vehicleMaintenanceHistory = maintenanceRecords
        .filter((record) => matchesVehicleMaintenance(vehicle, record))
        .sort((a, b) => toTimestamp(b.scheduledDate) - toTimestamp(a.scheduledDate));

      return {
        vehicle,
        statusLabel: getVehicleStatusLabel(vehicle),
        driverName,
        lastTripLabel: formatTripLabel(latestTrip?.startTime),
        lastTripTime: latestTrip?.startTime,
        currentAssignment,
        maintenanceHistory: vehicleMaintenanceHistory,
        maintenanceRecommendations: parseMaintenanceRecommendation(vehicle),
      };
    });
  }, [maintenanceRecords, trips, vehicles]);

  const filteredVehicles = useMemo<VehicleTableRow[]>(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return vehicleRows.filter((row) => {
      const { vehicle, statusLabel } = row;

      const matchesSearch =
        normalizedSearch.length === 0 ||
        `${vehicle.name} ${vehicle.plaque_immatriculation ?? ''} ${vehicle.vin ?? ''}`
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'available' && statusLabel === 'Available') ||
        (statusFilter === 'in_use' && statusLabel === 'In Use') ||
        (statusFilter === 'maintenance' && statusLabel === 'Maintenance') ||
        (statusFilter === 'inactive' && statusLabel === 'Inactive');

      const matchesType = typeFilter === 'all' || vehicle.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [searchQuery, statusFilter, typeFilter, vehicleRows]);

  const selectedVehicleRow = useMemo(() => {
    if (!selectedVehicleId) return null;
    return vehicleRows.find((row) => row.vehicle.id === selectedVehicleId) ?? null;
  }, [selectedVehicleId, vehicleRows]);

  const openVehicleDetails = useCallback((id: string) => {
    setSelectedVehicleId(id);
  }, []);

  const closeVehicleDetails = useCallback(() => {
    setSelectedVehicleId(null);
  }, []);

  const createVehicle = useCallback(async (data: Partial<Vehicle> | FormData) => {
    const created = await createVehicleMutation.mutateAsync(data);
    return created;
  }, [createVehicleMutation]);

  const updateVehicle = useCallback(async (id: string, data: Partial<Vehicle> | FormData) => {
    const updated = await updateVehicleMutation.mutateAsync({ id, data });
    return updated;
  }, [updateVehicleMutation]);

  const deleteVehicle = useCallback(async (id: string) => {
    await deleteVehicleMutation.mutateAsync(id);
  }, [deleteVehicleMutation]);

  const generateMaintenanceRecommendations = useCallback(async (vehicleId: string) => {
    return generateMaintenanceRecommendationsMutation.mutateAsync(vehicleId);
  }, [generateMaintenanceRecommendationsMutation]);

  const selectedVehicleDetails = selectedVehicleDetailsQuery.data ?? null;
  const isDetailsLoading = selectedVehicleDetailsQuery.isLoading || selectedVehicleDetailsQuery.isFetching;
  const detailsError = selectedVehicleDetailsQuery.error
    ? getErrorMessage(selectedVehicleDetailsQuery.error, 'Failed to load vehicle details')
    : null;

  return {
    vehicles,
    vehicleRows,
    filteredVehicles,
    isLoading,
    error,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    generateMaintenanceRecommendations,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    selectedVehicleId,
    selectedVehicleRow,
    selectedVehicleDetails,
    openVehicleDetails,
    closeVehicleDetails,
    isDetailsLoading,
    detailsError,
  };
};

export const useVehicleOptions = () => {
  const query = useQuery({
    queryKey: queryKeys.vehicles.lists(),
    queryFn: vehiclesService.getVehicles,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    vehicles: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? getErrorMessage(query.error, 'Failed to fetch vehicles') : null,
    refetch: query.refetch,
  };
};
