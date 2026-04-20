import { useState, useEffect, useCallback, useMemo } from 'react';
import { vehiclesService } from '../services/vehicles.service';
import { tripsService } from '../../trips/services/trips.service';
import { maintenanceService } from '../../maintenance/services/maintenance.service';
import type { Maintenance, Trip, Vehicle } from '../../../types';

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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<Maintenance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<VehicleTypeFilter>('all');

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState<Vehicle | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [vehicleData, tripsData, maintenanceData] = await Promise.all([
        vehiclesService.getVehicles(),
        tripsService.getTrips({ page: 1, limit: 300 }),
        maintenanceService.getAll({ page: 1, limit: 300 }),
      ]);

      setVehicles(vehicleData);
      setTrips(tripsData.items ?? []);
      setMaintenanceRecords(maintenanceData.items ?? []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch vehicles'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

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

  const openVehicleDetails = useCallback(async (id: string) => {
    setSelectedVehicleId(id);
    setSelectedVehicleDetails(null);
    setDetailsError(null);
    setIsDetailsLoading(true);

    try {
      const details = await vehiclesService.getVehicleById(id);
      setSelectedVehicleDetails(details);
    } catch (err: unknown) {
      setDetailsError(getErrorMessage(err, 'Failed to load vehicle details'));
    } finally {
      setIsDetailsLoading(false);
    }
  }, []);

  const closeVehicleDetails = useCallback(() => {
    setSelectedVehicleId(null);
    setSelectedVehicleDetails(null);
    setDetailsError(null);
    setIsDetailsLoading(false);
  }, []);

  const createVehicle = useCallback(async (data: Partial<Vehicle> | FormData) => {
    const created = await vehiclesService.createVehicle(data);
    setVehicles((prev) => [...prev, created]);
    return created;
  }, []);

  const updateVehicle = useCallback(async (id: string, data: Partial<Vehicle> | FormData) => {
    const updated = await vehiclesService.updateVehicle(id, data);
    setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));
    setSelectedVehicleDetails((prev) => (prev && prev.id === id ? updated : prev));
    return updated;
  }, []);

  const deleteVehicle = useCallback(async (id: string) => {
    await vehiclesService.deleteVehicle(id);
    setVehicles((prev) => prev.filter((v) => v.id !== id));

    if (selectedVehicleId === id) {
      setSelectedVehicleId(null);
      setSelectedVehicleDetails(null);
    }
  }, [selectedVehicleId]);

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