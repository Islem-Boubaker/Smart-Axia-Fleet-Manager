import type { Vehicle } from '../../../types';

export type VehicleStatusLabel = 'Available' | 'In Use' | 'Maintenance' | 'Inactive';

const normalizeStatus = (value: unknown): Vehicle['status'] | null => {
  if (typeof value !== 'string' || value.trim().length === 0) return null;

  const normalized = value.trim().toUpperCase().replace(/[-\s]+/g, '_');
  if (normalized === 'AVAILABLE') return 'AVAILABLE';
  if (normalized === 'ON_TRIP' || normalized === 'IN_USE') return 'ON_TRIP';
  if (normalized === 'IN_MAINTENANCE' || normalized === 'MAINTENANCE') return 'IN_MAINTENANCE';
  if (normalized === 'OUT_OF_SERVICE' || normalized === 'INACTIVE') return 'OUT_OF_SERVICE';
  return null;
};

const booleanFrom = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on', 'active', 'available'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n', 'off', 'inactive', 'out_of_service'].includes(normalized)) return false;
  }
  return fallback;
};

export const getVehicleStatusLabel = (vehicle: Vehicle): VehicleStatusLabel => {
  const raw = vehicle as unknown as {
    status?: unknown;
    Active?: unknown;
    active?: unknown;
    is_active?: unknown;
    Need_Maintenance?: unknown;
    need_maintenance?: unknown;
    needMaintenance?: unknown;
    maintenanceRequired?: unknown;
    needsMaintenance?: unknown;
  };

  const explicitStatus = normalizeStatus(raw.status);
  if (explicitStatus === 'AVAILABLE') return 'Available';
  if (explicitStatus === 'ON_TRIP') return 'In Use';
  if (explicitStatus === 'IN_MAINTENANCE') return 'Maintenance';
  if (explicitStatus === 'OUT_OF_SERVICE') return 'Inactive';

  const needsMaintenance = booleanFrom(
    raw.Need_Maintenance ??
      raw.need_maintenance ??
      raw.needMaintenance ??
      raw.maintenanceRequired ??
      raw.needsMaintenance,
    false,
  );

  if (needsMaintenance) return 'Maintenance';

  const isActive = booleanFrom(raw.Active ?? raw.active ?? raw.is_active, true);
  return isActive ? 'Available' : 'Inactive';
};

export const isVehicleAvailable = (vehicle: Vehicle) => getVehicleStatusLabel(vehicle) === 'Available';

export const isVehicleOperational = (vehicle: Vehicle) => {
  const label = getVehicleStatusLabel(vehicle);
  return label === 'Available' || label === 'In Use';
};
