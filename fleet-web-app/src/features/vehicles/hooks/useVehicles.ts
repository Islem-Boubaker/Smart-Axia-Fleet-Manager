import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vehiclesService } from '../services/vehicles.service';
import { tripsService } from '../../trips/services/trips.service';
import { maintenanceService } from '../../maintenance/services/maintenance.service';
import type { Maintenance, Trip, Vehicle } from '../../../types';
import { queryKeys } from '../../../shared/services/queryKeys';

export type VehicleStatusFilter = 'all' | 'available' | 'in_use' | 'maintenance' | 'inactive';
export type VehicleTypeFilter = Vehicle['type'] | 'all';
export type VehicleStatusLabel = 'Available' | 'In Use' | 'Maintenance' | 'Inactive';

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

const resolveStatus = (vehicle: Vehicle, activeTrip: Trip | undefined): VehicleStatusLabel => {
  if (vehicle.Need_Maintenance) return 'Maintenance';
  if (activeTrip) return 'In Use';
  return vehicle.Active ? 'Available' : 'Inactive';
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
  });

  const tripsQuery = useQuery({
    queryKey: queryKeys.trips.list({ page: 1, limit: 300 }),
    queryFn: () => tripsService.getTrips({ page: 1, limit: 300 }),
  });

  const maintenanceQuery = useQuery({
    queryKey: queryKeys.maintenance.list({ page: 1, limit: 300 }),
    queryFn: () => maintenanceService.getAll({ page: 1, limit: 300 }),
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

  const vehicles = vehiclesQuery.data ?? [];
  const trips = tripsQuery.data?.items ?? [];
  const maintenanceRecords = maintenanceQuery.data?.items ?? [];
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

      const activeTrip = relatedTrips.find((trip) => trip.status === 'ongoing' || trip.status === 'scheduled');
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
        statusLabel: resolveStatus(vehicle, activeTrip),
        driverName,
        lastTripLabel: formatTripLabel(latestTrip?.startTime),
        lastTripTime: latestTrip?.startTime,
        currentAssignment,
        maintenanceHistory: vehicleMaintenanceHistory,
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
  });

  return {
    vehicles: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? getErrorMessage(query.error, 'Failed to fetch vehicles') : null,
    refetch: query.refetch,
  };
};