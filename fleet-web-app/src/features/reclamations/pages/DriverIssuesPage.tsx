import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Badge, GlobalCard, Input, Select } from '../../../shared/components';
import { driversService } from '../../drivers/services/drivers.service';
import { vehiclesService } from '../../vehicles/services/vehicles.service';
import type { Driver, Vehicle } from '../../../types';
import { pageShellClasses, pageShellInnerSpacing } from '../../../shared/utils/pageShell';
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

const statusVariant: Record<ReclamationStatus, 'warning' | 'info' | 'success' | 'error'> = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
  REJECTED: 'error',
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-GB');
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

      <div className={`rounded-2xl border p-4 ${dark ? 'border-slate-700/80 bg-slate-900/35' : 'border-slate-200/90 bg-white/80 shadow-glass'}`}>
        <div className="flex flex-wrap gap-2">
          {(['all', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'] as const).map((status) => {
            const active = statusFilter === status;
            const label = status === 'all' ? 'All' : statusLabel[status];
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? dark
                      ? 'bg-brand/20 text-brand'
                      : 'bg-brand-light text-brand-deep'
                    : dark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Input
            label="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Quick search: subject, message, driver, vehicle"
          />

          <div>
            <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">Driver</label>
            <Select
              dark={dark}
              value={driverFilter}
              onChange={(value) => setDriverFilter(value)}
              options={driverSelectOptions}
            />
          </div>

          <div>
            <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">Vehicle</label>
            <Select
              dark={dark}
              value={vehicleFilter}
              onChange={(value) => setVehicleFilter(value)}
              options={vehicleSelectOptions}
            />
          </div>
        </div>
      </div>

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
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className={`w-full rounded-2xl border p-4 text-left transition ${dark ? 'border-slate-700/80 bg-slate-900/40 hover:bg-slate-800/50' : 'border-slate-200/90 bg-white/90 hover:bg-slate-50 shadow-glass'}`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className={`text-sm font-semibold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{item.subject}</p>
                <Badge variant={statusVariant[item.status]} size="sm">
                  {statusLabel[item.status]}
                </Badge>
              </div>
              <p className={`mt-1 line-clamp-2 text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{item.message}</p>
              <p className={`mt-1 text-xs ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                Driver: {getDriverLabel(item)}, Vehicle: {getVehicleLabel(item)}
              </p>
              <p className={`mt-2 text-xs ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                Submitted: {formatDateTime(item.createdAt)}
              </p>
            </button>
          ))}
        </div>
      )}

      <GlobalCard
        isOpen={Boolean(selected)}
        onClose={closeDetails}
        title={selected ? `Issue report #${selected.id}` : 'Issue report'}
        maxWidth="2xl"
      >
        {selected && (
          <div className="space-y-5">
            <div
              className={`rounded-2xl border px-4 py-4 ${
                dark
                  ? 'border-slate-700/80 bg-gradient-to-br from-slate-900 to-slate-900/60'
                  : 'border-slate-200 bg-gradient-to-br from-white to-slate-50'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Driver Issue
                  </p>
                  <p className={`mt-1 text-lg font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{selected.subject}</p>
                </div>
                <Badge variant={statusVariant[selected.status]} size="sm">
                  {statusLabel[selected.status]}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    dark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  ID #{selected.id}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    dark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Submitted {formatDateTime(selected.createdAt)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
              <div className={`rounded-2xl border p-4 ${dark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50/70'}`}>
                <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.12em] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Description
                </p>
                <p className={`whitespace-pre-wrap text-sm leading-relaxed ${dark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {selected.message}
                </p>
              </div>

              <div className={`rounded-2xl border p-4 ${dark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-white/90'}`}>
                <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.12em] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Context
                </p>
                <div className="space-y-2.5 text-sm">
                  <div className={`rounded-xl border px-3 py-2 ${dark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50/80'}`}>
                    <p className={dark ? 'text-slate-500 text-[11px]' : 'text-slate-500 text-[11px]'}>Driver</p>
                    <p className={`font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>{getDriverLabel(selected)}</p>
                  </div>
                  <div className={`rounded-xl border px-3 py-2 ${dark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50/80'}`}>
                    <p className={dark ? 'text-slate-500 text-[11px]' : 'text-slate-500 text-[11px]'}>Vehicle</p>
                    <p className={`font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>{getVehicleLabel(selected)}</p>
                  </div>
                  <div className={`rounded-xl border px-3 py-2 ${dark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50/80'}`}>
                    <p className={dark ? 'text-slate-500 text-[11px]' : 'text-slate-500 text-[11px]'}>Last update</p>
                    <p className={`font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>{formatDateTime(selected.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {selected.images?.length ? (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className={`text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>Attachments</p>
                  <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                    {selected.images.length} file{selected.images.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {selected.images.map((image, index) => (
                    <a
                      key={`${selected.id}-img-${index}`}
                      href={image}
                      target="_blank"
                      rel="noreferrer"
                      className={`group block overflow-hidden rounded-2xl border transition ${
                        dark ? 'border-slate-700 hover:border-slate-500' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Issue attachment ${index + 1}`}
                        className="h-44 w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                      />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </GlobalCard>
    </div>
  );
};

export default DriverIssuesPage;
