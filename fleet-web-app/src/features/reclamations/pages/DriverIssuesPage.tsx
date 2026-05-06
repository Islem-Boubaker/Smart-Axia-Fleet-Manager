import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { driversService } from '../../drivers/services/drivers.service';
import { vehiclesService } from '../../vehicles/services/vehicles.service';
import type { Driver, Vehicle } from '../../../types';
import { buildMaintenancePrefillUrl } from '../../maintenance/utils/maintenancePrefill';
import { pageShellClasses, pageShellInnerSpacing } from '../../../shared/utils/pageShell';
import DriverIssuesFilters from '../components/DriverIssuesFilters';
import DriverIssueDetailsModal from '../components/DriverIssueDetailsModal';
import DriverIssuesTable from '../components/DriverIssuesTable';
import reclamationsService, {
  type ReclamationRecord,
  type ReclamationStatus,
} from '../services/reclamations.service';
import { queryKeys } from '../../../shared/services/queryKeys';
import { useUpdateReclamationStatus } from '../hooks/useReclamations';

interface ThemeContext {
  dark: boolean;
}

const normalize = (value?: string | null) => String(value ?? '').trim().toLowerCase();

const metadataString = (metadata: Record<string, unknown> | undefined, key: string) => {
  const value = metadata?.[key];
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const normalizePriority = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return ['low', 'medium', 'high'].includes(normalized) ? normalized : 'high';
};

const buildVehicleLabel = (vehicle: Vehicle) =>
  vehicle.plaque_immatriculation ? `${vehicle.name} - ${vehicle.plaque_immatriculation}` : vehicle.name;

const findVehicleFromAssignedValue = (assignedValue: string | undefined, vehicles: Vehicle[]) => {
  const normalizedAssigned = normalize(assignedValue);
  if (!normalizedAssigned) return undefined;

  return vehicles.find((vehicle) => {
    const normalizedId = normalize(vehicle.id);
    const normalizedName = normalize(vehicle.name);
    const normalizedPlate = normalize(vehicle.plaque_immatriculation);
    const normalizedLabel = normalize(buildVehicleLabel(vehicle));

    return (
      normalizedAssigned === normalizedId ||
      normalizedAssigned === normalizedPlate ||
      normalizedAssigned === normalizedName ||
      normalizedAssigned === normalizedLabel
    );
  });
};

const DriverIssuesPage = () => {
  const { dark } = useOutletContext<ThemeContext>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [statusFilter, setStatusFilter] = useState<'all' | ReclamationStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [driverFilter, setDriverFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [selected, setSelected] = useState<ReclamationRecord | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const updateStatusMutation = useUpdateReclamationStatus();
  const statusLabel = useMemo<Record<ReclamationStatus, string>>(
    () => ({
      PENDING: t('status.pending'),
      IN_PROGRESS: t('status.in_progress'),
      RESOLVED: t('status.resolved'),
      REJECTED: t('status.rejected'),
    }),
    [t],
  );

  const requestedId = searchParams.get('reclamationId');

  const reclamationsQuery = useQuery({
    queryKey: queryKeys.reclamations.list({ page: 1, limit: 200 }),
    queryFn: () => reclamationsService.getAll(1, 200),
  });

  const driversQuery = useQuery({
    queryKey: queryKeys.drivers.lists(),
    queryFn: driversService.getDrivers,
  });

  const vehiclesQuery = useQuery({
    queryKey: queryKeys.vehicles.lists(),
    queryFn: vehiclesService.getVehicles,
  });

  const items = useMemo(() => (reclamationsQuery.data?.items ?? []) as ReclamationRecord[], [reclamationsQuery.data?.items]);
  const drivers = useMemo(() => (driversQuery.data ?? []) as Driver[], [driversQuery.data]);
  const vehicles = useMemo(() => (vehiclesQuery.data ?? []) as Vehicle[], [vehiclesQuery.data]);
  const loading = reclamationsQuery.isLoading || driversQuery.isLoading || vehiclesQuery.isLoading;

  const queryError = reclamationsQuery.error || driversQuery.error || vehiclesQuery.error;
  const error =
    (queryError as { response?: { data?: { message?: string } }; message?: string } | null)?.response?.data?.message ||
    (queryError as Error | null)?.message ||
    null;

  const handleUpdateStatus = useCallback(async (item: ReclamationRecord, status: ReclamationStatus) => {
    try {
      setStatusError(null);
      const updated = await updateStatusMutation.mutateAsync({ id: item.id, status });
      setSelected(updated);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        t('common.unexpectedError');
      setStatusError(message);
    }
  }, [t, updateStatusMutation]);

  const selectedIssue = useMemo(() => {
    if (selected) return selected;
    if (!requestedId || items.length === 0) return null;
    return items.find((item) => String(item.id) === String(requestedId)) ?? null;
  }, [selected, requestedId, items]);

  const getDriverLabel = useCallback((item: ReclamationRecord) => {
    if (item.driverName) return item.driverName;
    if (item.driver?.name || item.driver?.email) return item.driver.name || item.driver.email || item.userId;
    const driver = drivers.find((d) => String(d.id) === String(item.userId));
    return driver?.name || item.userId;
  }, [drivers]);

  const getVehicleLabel = useCallback((item: ReclamationRecord) => {
    if (item.vehicleName || item.vehiclePlate) {
      return item.vehicleName && item.vehiclePlate
        ? `${item.vehicleName} (${item.vehiclePlate})`
        : item.vehicleName || item.vehiclePlate || t('common.na');
    }
    if (item.vehicle?.name || item.vehicle?.plaque_immatriculation || item.vehicle?.model) {
      const name = item.vehicle.name || item.vehicle.model || t('common.vehicleDefaultName');
      const plate = item.vehicle.plaque_immatriculation;
      return plate ? `${name} (${plate})` : name;
    }
    const byVehicleId = item.vehicleId
      ? vehicles.find((v) => String(v.id) === String(item.vehicleId))
      : undefined;
    if (byVehicleId) return buildVehicleLabel(byVehicleId);

    const driver = drivers.find((d) => String(d.id) === String(item.userId));
    const assignedMatch = findVehicleFromAssignedValue(driver?.assignedVehicle, vehicles);
    if (assignedMatch) return buildVehicleLabel(assignedMatch);

    return item.vehicleId || t('common.na');
  }, [drivers, t, vehicles]);

  const handleScheduleFromIssue = useCallback((item: ReclamationRecord) => {
    const matchedVehicle =
      (item.vehicleId ? vehicles.find((v) => String(v.id) === String(item.vehicleId)) : undefined) ||
      (item.vehiclePlate ? vehicles.find((v) => normalize(v.plaque_immatriculation) === normalize(item.vehiclePlate)) : undefined) ||
      findVehicleFromAssignedValue(
        drivers.find((d) => String(d.id) === String(item.userId))?.assignedVehicle,
        vehicles
      );
    const vehicleId = item.vehicleId || matchedVehicle?.id || item.vehicle?.id || '';
    const vehiclePlate =
      item.vehiclePlate ||
      matchedVehicle?.plaque_immatriculation ||
      item.vehicle?.plaque_immatriculation ||
      '';
    const vehicleName =
      item.vehicleName ||
      matchedVehicle?.name ||
      item.vehicle?.name ||
      item.vehicle?.model ||
      '';

    const metadata = item.metadata ?? {};
    const maintenanceType = metadataString(metadata, 'maintenanceType') || 'General Inspection';
    const priority = normalizePriority(metadataString(metadata, 'maintenancePriority'));
    const estimatedCost = metadataString(metadata, 'estimatedCost') || '0';
    const currentMileage = metadataString(metadata, 'currentMileage');
    const maintenanceNotes = metadataString(metadata, 'maintenanceNotes');

    navigate(buildMaintenancePrefillUrl({
      source: 'reclamation',
      reclamationId: item.id,
      vehicleId,
      vehiclePlate,
      vehicleName,
      type: maintenanceType,
      priority,
      technician: t('maintenance.table.tbd'),
      cost: estimatedCost,
      mileage: currentMileage,
      description: [
        `Created from driver issue: ${item.subject}`,
        '',
        `Requested maintenance: ${maintenanceType}`,
        `Priority: ${priority}`,
        estimatedCost ? `Estimated cost: ${estimatedCost} TND` : '',
        currentMileage ? `Current mileage: ${currentMileage} km` : '',
        maintenanceNotes ? `Maintenance notes: ${maintenanceNotes}` : '',
        '',
        item.message,
        '',
        `Driver: ${getDriverLabel(item)}`,
        `Vehicle: ${getVehicleLabel(item)}`,
      ].filter(Boolean).join('\n'),
    }));
  }, [drivers, getDriverLabel, getVehicleLabel, navigate, t, vehicles]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return [...items]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter((item) => {
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;

        const driver = getDriverLabel(item);
        const vehicle = getVehicleLabel(item);

        if (driverFilter !== 'all' && driver !== driverFilter) return false;
        if (vehicleFilter !== 'all' && vehicle !== vehicleFilter) return false;

        if (!normalizedSearch) return true;

        const haystack = `${item.subject} ${item.message} ${driver} ${vehicle}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      });
  }, [items, searchQuery, statusFilter, driverFilter, vehicleFilter, getDriverLabel, getVehicleLabel]);

  const driverFilterOptions = useMemo(() => {
    const unique = new Set(items.map((item) => getDriverLabel(item)));
    return ['all', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [items, getDriverLabel]);

  const vehicleFilterOptions = useMemo(() => {
    const unique = new Set(items.map((item) => getVehicleLabel(item)));
    return ['all', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [items, getVehicleLabel]);

  const driverSelectOptions = useMemo(
    () => driverFilterOptions.map((option) => ({ value: option, label: option === 'all' ? t('reclamations.filters.all_drivers') : option })),
    [driverFilterOptions, t]
  );

  const vehicleSelectOptions = useMemo(
    () => vehicleFilterOptions.map((option) => ({ value: option, label: option === 'all' ? t('reclamations.filters.all_vehicles') : option })),
    [t, vehicleFilterOptions]
  );

  const closeDetails = () => {
    setSelected(null);
    if (searchParams.has('reclamationId')) {
      const next = new URLSearchParams(searchParams);
      next.delete('reclamationId');
      setSearchParams(next);
    }
  };

  return (
    <div className={`${pageShellClasses(dark)} ${pageShellInnerSpacing} animate-fade-in`}>
      <div className="fleet-hero space-y-1">
        <p className="fleet-hero-kicker">{t('reclamations.section_label')}</p>
        <h1 className="fleet-hero-title">{t('reclamations.title')}</h1>
        <p className="fleet-hero-subtitle">{t('reclamations.subtitle')}</p>
      </div>

      <DriverIssuesFilters
        dark={dark}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        driverFilter={driverFilter}
        onDriverChange={setDriverFilter}
        vehicleFilter={vehicleFilter}
        onVehicleChange={setVehicleFilter}
        driverOptions={driverSelectOptions}
        vehicleOptions={vehicleSelectOptions}
        statusLabel={statusLabel}
      />

      {(error || statusError) && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${dark ? 'border-red-900/50 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {error || statusError}
        </div>
      )}

      {loading ? (
        <div className={`rounded-2xl border px-6 py-16 text-center text-sm ${dark ? 'border-slate-700/80 bg-slate-900/30 text-slate-400' : 'border-slate-200/90 bg-white/75 text-slate-500'}`}>
          {t('reclamations.table.loading')}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className={`rounded-2xl border px-6 py-16 text-center text-sm ${dark ? 'border-slate-700/80 bg-slate-900/30 text-slate-400' : 'border-slate-200/90 bg-white/75 text-slate-500'}`}>
          {t('reclamations.table.empty')}
        </div>
      ) : (
        <DriverIssuesTable
          items={filteredItems}
          dark={dark}
          onView={setSelected}
          getDriverLabel={getDriverLabel}
          getVehicleLabel={getVehicleLabel}
          statusLabel={statusLabel}
        />
      )}

      <DriverIssueDetailsModal
        issue={selectedIssue}
        isOpen={Boolean(selectedIssue)}
        dark={dark}
        onClose={closeDetails}
        statusLabel={statusLabel}
        getDriverLabel={getDriverLabel}
        getVehicleLabel={getVehicleLabel}
        onScheduleMaintenance={handleScheduleFromIssue}
        onUpdateStatus={handleUpdateStatus}
        isUpdatingStatus={updateStatusMutation.isPending}
      />
    </div>
  );
};

export default DriverIssuesPage;
