import type { NotificationRecord } from '../../../shared/services/notification.api';
import { ROUTES } from '../../../utils/constants';

const INSURANCE_TYPE = 'Insurance Renewal';
const TECH_VISIT_TYPE = 'Technical Visit';
const DEFAULT_TYPE = 'General Inspection';

const asString = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

export const resolveMaintenanceTypeFromAlert = (alert: Pick<NotificationRecord, 'type' | 'title' | 'message' | 'metadata'>) => {
  const metadata = alert.metadata ?? {};
  const text = [
    alert.type,
    alert.title,
    alert.message,
    asString(metadata.category),
    asString(metadata.maintenanceType),
  ]
    .join(' ')
    .toLowerCase();

  if (text.includes('insurance')) return INSURANCE_TYPE;
  if (text.includes('tech') || text.includes('technical')) return TECH_VISIT_TYPE;
  return DEFAULT_TYPE;
};

export const isMaintenanceDocumentAlert = (alert: Pick<NotificationRecord, 'type' | 'title' | 'message' | 'metadata'>) => {
  const maintenanceType = resolveMaintenanceTypeFromAlert(alert);
  return maintenanceType === INSURANCE_TYPE || maintenanceType === TECH_VISIT_TYPE;
};

export const buildMaintenancePrefillUrl = ({
  source = 'alert',
  vehicleId,
  vehicleName,
  vehiclePlate,
  type = DEFAULT_TYPE,
  priority = 'high',
  technician = 'Pending assignment',
  cost = '0',
  mileage,
  reclamationId,
  description,
}: {
  source?: string;
  vehicleId?: string | null;
  vehicleName?: string | null;
  vehiclePlate?: string | null;
  type?: string | null;
  priority?: string | null;
  technician?: string | null;
  cost?: string | number | null;
  mileage?: string | number | null;
  reclamationId?: string | null;
  description?: string | null;
}) => {
  const params = new URLSearchParams({
    schedule: '1',
    source,
    type: asString(type) || DEFAULT_TYPE,
    priority: asString(priority) || 'high',
    technician: asString(technician) || 'Pending assignment',
    cost: asString(cost) || '0',
  });

  const values = {
    vehicleId: asString(vehicleId),
    vehicleName: asString(vehicleName),
    vehiclePlate: asString(vehiclePlate),
    mileage: asString(mileage),
    reclamationId: asString(reclamationId),
    description: asString(description),
  };

  Object.entries(values).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  return `${ROUTES.MAINTENANCE}?${params.toString()}`;
};

export const buildMaintenancePrefillUrlFromAlert = (alert: NotificationRecord) => {
  const metadata = alert.metadata ?? {};
  const vehicleId = asString(metadata.vehicleId) || asString(metadata.referenceId) || asString(alert.entityId);
  const vehicleName = asString(metadata.vehicleName) || asString(metadata.name);
  const vehiclePlate = asString(metadata.vehiclePlate) || asString(metadata.plate);
  const maintenanceType = resolveMaintenanceTypeFromAlert(alert);
  const expiresAt = asString(metadata.expiresAt);
  const vehicleLabel = vehicleName && vehiclePlate ? `${vehicleName} (${vehiclePlate})` : vehicleName || vehiclePlate || 'Vehicle';

  return buildMaintenancePrefillUrl({
    source: 'alert',
    vehicleId,
    vehicleName,
    vehiclePlate,
    type: maintenanceType,
    priority: alert.priority === 'critical' ? 'high' : 'medium',
    description: [
      `Created from ${maintenanceType.toLowerCase()} alert.`,
      '',
      alert.message,
      '',
      `Vehicle: ${vehicleLabel}`,
      expiresAt ? `Current expiry date: ${expiresAt}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  });
};
