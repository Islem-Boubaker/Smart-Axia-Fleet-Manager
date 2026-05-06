import { AppDataTable, AppRowActions, AppStatusBadge, AppTd, AppTr, Button } from '../../../shared/components';
import { useTranslation } from 'react-i18next';
import type { Trip } from '../../../types';

interface Props {
  trips: Trip[];
  dark?: boolean;
  actionTripId?: string | null;
  onViewDetails?: (trip: Trip) => void;
  onEdit?: (trip: Trip) => void;
  onStart?: (tripId: string) => void;
  onReachStop?: (tripId: string, stopId: string) => void;
  onComplete?: (tripId: string) => void;
  onCancel?: (tripId: string) => void;
}

const TripsList = ({ trips, dark = false, actionTripId = null, onViewDetails, onEdit, onCancel }: Props) => {
  const { t, i18n } = useTranslation();
  const normalizeStatusKey = (value: string) =>
    value.toLowerCase().replace(/\s+/g, '_').replace(/-+/g, '_');
  if (trips.length === 0)
    return (
      <div
        className={`rounded-2xl border px-6 py-16 text-center ${
          dark ? 'border-slate-700/80 bg-slate-900/40' : 'border-slate-200/90 bg-white/60 backdrop-blur-sm'
        }`}
      >
        <p className={dark ? 'text-slate-400' : 'text-slate-500'}>{t('trips.table.empty')}</p>
      </div>
    );

  const statusVariant = (status: Trip['status']) => {
    if (status === 'completed') return 'success';
    if (status === 'ongoing') return 'info';
    if (status === 'scheduled') return 'warning';
    if (status === 'cancelled') return 'danger';
    return 'neutral';
  };

  const formatDate = (value?: string) => {
    if (!value) return t('common.na');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(i18n.language);
  };

  return (
    <AppDataTable
      columns={[
        t('trips.table.route'),
        t('trips.table.driver'),
        t('trips.table.vehicle'),
        t('trips.table.distance'),
        t('trips.table.start'),
        t('trips.table.status'),
        t('trips.table.actions'),
      ]}
      totalResults={trips.length}
      dark={dark}
      ariaLabel={t('trips.table.aria')}
    >
      {trips.map((trip) => {
        const isBusy = actionTripId === trip.id;

        return (
          <AppTr key={trip.id}>
            <AppTd className={dark ? 'text-slate-200' : 'text-slate-700'}>
              {trip.startLocation} {'->'} {trip.endLocation}
            </AppTd>

            <AppTd className={dark ? 'text-slate-300' : 'text-slate-600'}>{trip.driver?.name || t('common.unassigned')}</AppTd>
            <AppTd className={dark ? 'text-slate-300' : 'text-slate-600'}>
              {trip.vehicle?.name || t('common.unknownVehicle')}
            </AppTd>

            <AppTd className={dark ? 'text-slate-300' : 'text-slate-600'}>
              {t('common.km', { n: trip.distance ?? 0 })}
            </AppTd>

            <AppTd className={dark ? 'text-slate-300' : 'text-slate-600'}>{formatDate(trip.startTime)}</AppTd>

            <AppTd>
              <AppStatusBadge variant={statusVariant(trip.status)}>
                {t(`status.${normalizeStatusKey(trip.status)}`)}
              </AppStatusBadge>
            </AppTd>

            <AppTd>
              <div className="flex flex-wrap items-center gap-2">
                {(trip.status === 'scheduled' || trip.status === 'ongoing') && (
                  <Button type="button" size="sm" variant="secondary" onClick={() => onCancel?.(trip.id)} disabled={isBusy}>
                    {t('common.cancel')}
                  </Button>
                )}

                <AppRowActions
                  onView={onViewDetails ? () => onViewDetails(trip) : undefined}
                  onEdit={onEdit ? () => onEdit(trip) : undefined}
                  disabled={isBusy}
                />
              </div>
            </AppTd>
          </AppTr>
        );
      })}
    </AppDataTable>
  );
};

export default TripsList;
