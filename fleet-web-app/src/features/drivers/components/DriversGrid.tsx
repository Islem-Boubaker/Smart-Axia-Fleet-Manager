import { AppDataTable, AppRowActions, AppStatusBadge, AppTd, AppTr } from '../../../shared/components';
import type { Driver } from '../../../types';

interface Props {
  drivers: Driver[];
  isLoading: boolean;
  onEdit: (driver: Driver) => void;
  onDelete: (id: string) => void;
  dark?: boolean;
}

const DriversGrid = ({ drivers, isLoading, onEdit, onDelete, dark = false }: Props) => {
  if (isLoading)
    return (
      <div className={`text-center py-16 rounded-2xl border ${dark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
        Loading…
      </div>
    );

  if (drivers.length === 0)
    return (
      <div
        className={`rounded-2xl border px-6 py-16 text-center ${
          dark ? 'border-slate-700/80 bg-slate-900/40' : 'border-slate-200/90 bg-white/60 backdrop-blur-sm'
        }`}
      >
        <p className={dark ? 'text-slate-400' : 'text-slate-500'}>No drivers available.</p>
      </div>
    );

  const statusVariant = (status: Driver['status']) => {
    if (status === 'active') return 'success';
    if (status === 'on-leave') return 'warning';
    return 'neutral';
  };

  return (
    <AppDataTable
      columns={['Avatar', 'Driver', 'Email', 'Phone', 'Status', 'Assigned Vehicle', 'Trips', 'Actions']}
      totalResults={drivers.length}
      dark={dark}
      ariaLabel="Drivers table"
    >
      {drivers.map((driver) => (
        <AppTr key={driver.id}>
          <AppTd>
            {driver.avatar ? (
              <img
                src={driver.avatar}
                alt={driver.name}
                className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                  const fallback = event.currentTarget.nextElementSibling as HTMLSpanElement | null;
                  if (fallback) {
                    fallback.style.display = 'inline-flex';
                  }
                }}
              />
            ) : null}
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${
                dark ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700'
              } ${driver.avatar ? 'hidden' : 'inline-flex'}`}
              aria-hidden={Boolean(driver.avatar)}
            >
              {driver.name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'DR'}
            </span>
          </AppTd>

          <AppTd className={dark ? 'text-slate-100' : 'text-slate-900'}>
            <div>
              <p className="font-semibold">{driver.name}</p>
              <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                {driver.licenseNumber || 'No license number'}
              </p>
            </div>
          </AppTd>

          <AppTd className={dark ? 'text-slate-200' : 'text-slate-700'}>{driver.email}</AppTd>
          <AppTd className={dark ? 'text-slate-300' : 'text-slate-600'}>{driver.phone || 'N/A'}</AppTd>

          <AppTd>
            <AppStatusBadge variant={statusVariant(driver.status)}>{driver.status}</AppStatusBadge>
          </AppTd>

          <AppTd className={dark ? 'text-slate-300' : 'text-slate-600'}>{driver.assignedVehicle || 'Unassigned'}</AppTd>
          <AppTd className={dark ? 'text-slate-300' : 'text-slate-600'}>{driver.totalTrips ?? 0}</AppTd>

          <AppTd>
            <AppRowActions
              onEdit={() => onEdit(driver)}
              onDelete={() => onDelete(driver.id)}
            />
          </AppTd>
        </AppTr>
      ))}
    </AppDataTable>
  );
};

export default DriversGrid;
