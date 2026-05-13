import { AppDataTable, AppRowActions, AppStatusBadge, AppTd, AppTr } from '../../../shared/components';
import { Badge } from '../../../shared/components';
import { TranslatedText } from '../../../shared/components/TranslatedText';
import { useTranslation } from 'react-i18next';
import type { Driver } from '../../../types';

interface Props {
  drivers: Driver[];
  isLoading: boolean;
  onEdit: (driver: Driver) => void;
  onDelete: (id: string) => void;
  dark?: boolean;
}

const DriversGrid = ({ drivers, isLoading, onEdit, onDelete, dark = false }: Props) => {
  const { t } = useTranslation();
  const normalizeStatusKey = (value: string) => value.toLowerCase().replace(/\s+/g, '_').replace(/-+/g, '_');

  if (isLoading)
    return (
      <div className={`text-center py-16 rounded-2xl border ${dark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
        {t('drivers.table.loading')}
      </div>
    );

  if (drivers.length === 0)
    return (
      <div
        className={`rounded-2xl border px-6 py-16 text-center ${
          dark ? 'border-slate-700/80 bg-slate-900/40' : 'border-slate-200/90 bg-white/60 backdrop-blur-sm'
        }`}
      >
        <p className={dark ? 'text-slate-400' : 'text-slate-500'}>{t('drivers.table.empty')}</p>
      </div>
    );

  const statusVariant = (status: Driver['status']) => {
    if (status === 'active') return 'success';
    if (status === 'on-leave') return 'warning';
    return 'neutral';
  };

  return (
    <AppDataTable
      columns={[
        t('drivers.table.avatar'),
        t('drivers.table.driver'),
        t('drivers.table.email'),
        t('drivers.table.phone'),
        t('drivers.table.status'),
        t('drivers.table.assigned_vehicle'),
        t('drivers.table.trips'),
        t('drivers.table.actions'),
      ]}
      totalResults={drivers.length}
      dark={dark}
      ariaLabel={t('drivers.table.aria')}
      title={t('drivers.title')}
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
              <div className="flex items-center gap-2">
                <p className="font-semibold">{driver.name}</p>
                {driver.experienceBadge ? (
                  <Badge size="sm" variant="info">
                    <TranslatedText text={driver.experienceBadge.label} />
                  </Badge>
                ) : null}
              </div>
              <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                {driver.licenseNumber || t('drivers.table.noLicense')}
              </p>
            </div>
          </AppTd>

          <AppTd className={dark ? 'text-slate-200' : 'text-slate-700'}>{driver.email}</AppTd>
          <AppTd className={dark ? 'text-slate-300' : 'text-slate-600'}>{driver.phone || t('common.na')}</AppTd>

          <AppTd>
            <AppStatusBadge variant={statusVariant(driver.status)}>{t(`status.${normalizeStatusKey(driver.status)}`)}</AppStatusBadge>
          </AppTd>

          <AppTd className={dark ? 'text-slate-300' : 'text-slate-600'}>{driver.assignedVehicle || t('common.unassigned')}</AppTd>
          <AppTd className={dark ? 'text-slate-300' : 'text-slate-600'}>
            <div className="space-y-1">
              <p>{driver.totalTrips ?? 0}</p>
              {typeof driver.driverScore === 'number' ? (
                <p className="text-xs text-slate-400 dark:text-slate-500">{t('common.scoreLabel', { score: driver.driverScore })}</p>
              ) : null}
            </div>
          </AppTd>

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
