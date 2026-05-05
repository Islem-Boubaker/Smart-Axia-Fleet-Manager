import { useCallback, useMemo, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { driversService } from '../../drivers/services/drivers.service';
import { vehiclesService } from '../../vehicles/services/vehicles.service';
import type { Driver, Vehicle } from '../../../types';
import { pageShellClasses, pageShellInnerSpacing } from '../../../shared/utils/pageShell';
import DriverIssuesFilters from '../components/DriverIssuesFilters';
import DriverIssueDetailsModal from '../components/DriverIssueDetailsModal';
import DriverIssuesTable from '../components/DriverIssuesTable';
import reclamationsService, {
  type ReclamationRecord,
  type ReclamationStatus,
} from '../services/reclamations.service';
import { queryKeys } from '../../../shared/services/queryKeys';

interface ThemeContext {
  dark: boolean;
}

const normalize = (value?: string | null) => String(value ?? '').trim().toLowerCase();

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
  const [searchParams, setSearchParams] = useSearchParams();

  const [statusFilter, setStatusFilter] = useState<'all' | ReclamationStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [driverFilter, setDriverFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [selected, setSelected] = useState<ReclamationRecord | null>(null);

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

  const selectedIssue = useMemo(() => {
    if (selected) return selected;
    if (!requestedId || items.length === 0) return null;
    return items.find((item) => String(item.id) === String(requestedId)) ?? null;
  }, [selected, requestedId, items]);

  const getDriverLabel = useCallback((item: ReclamationRecord) => {
    const driver = drivers.find((d) => String(d.id) === String(item.userId));
    return driver?.name || item.userId;
  }, [drivers]);

  const getVehicleLabel = useCallback((item: ReclamationRecord) => {
    const byVehicleId = item.vehicleId
      ? vehicles.find((v) => String(v.id) === String(item.vehicleId))
      : undefined;
    if (byVehicleId) return buildVehicleLabel(byVehicleId);

    const driver = drivers.find((d) => String(d.id) === String(item.userId));
    const assignedMatch = findVehicleFromAssignedValue(driver?.assignedVehicle, vehicles);
    if (assignedMatch) return buildVehicleLabel(assignedMatch);

    return item.vehicleId || t('common.na');
  }, [drivers, vehicles, t]);

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
    [vehicleFilterOptions, t]
  );

  const statusLabel = useMemo(() => ({
    PENDING: t('status.pending'),
    IN_PROGRESS: t('status.in_progress'),
    RESOLVED: t('status.resolved'),
    REJECTED: t('status.rejected'),
  }), [t]);

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
      <div className="space-y-1 px-1">
        <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
          {t('reclamations.section_label')}
        </p>
        <h1 className={`text-2xl font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>{t('reclamations.title')}</h1>
        <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
          {t('reclamations.subtitle')}
        </p>
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

      {error && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${dark ? 'border-red-900/50 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {error}
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
      />
    </div>
  );
};

export default DriverIssuesPage;
