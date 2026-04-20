import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
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

interface ThemeContext {
  dark: boolean;
}

const statusLabel: Record<ReclamationStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected',
};

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
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<ReclamationRecord[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ReclamationStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [driverFilter, setDriverFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [selected, setSelected] = useState<ReclamationRecord | null>(null);

  const requestedId = searchParams.get('reclamationId');

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const [data, driversData, vehiclesData] = await Promise.all([
          reclamationsService.getAll(1, 200),
          driversService.getDrivers(),
          vehiclesService.getVehicles(),
        ]);
        if (!mounted) return;
        setItems(data.items);
        setDrivers(driversData ?? []);
        setVehicles(vehiclesData ?? []);
      } catch (err: unknown) {
        if (!mounted) return;
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err as Error)?.message ||
          'Failed to load driver issue reports.';
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!requestedId || items.length === 0) return;
    const match = items.find((item) => String(item.id) === String(requestedId));
    if (match) {
      setSelected(match);
    }
  }, [requestedId, items]);

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

    return item.vehicleId || 'N/A';
  }, [drivers, vehicles]);

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
    () => driverFilterOptions.map((option) => ({ value: option, label: option === 'all' ? 'All drivers' : option })),
    [driverFilterOptions]
  );

  const vehicleSelectOptions = useMemo(
    () => vehicleFilterOptions.map((option) => ({ value: option, label: option === 'all' ? 'All vehicles' : option })),
    [vehicleFilterOptions]
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
      <div className="space-y-1 px-1">
        <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
          Operations
        </p>
        <h1 className={`text-2xl font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>Driver Issue Reports</h1>
        <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
          Monitor vehicle issues submitted by drivers.
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
          Loading driver issue reports...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className={`rounded-2xl border px-6 py-16 text-center text-sm ${dark ? 'border-slate-700/80 bg-slate-900/30 text-slate-400' : 'border-slate-200/90 bg-white/75 text-slate-500'}`}>
          No issue reports found.
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
        issue={selected}
        isOpen={Boolean(selected)}
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
