import { AppDataTable, AppRowActions, AppStatusBadge, AppTd, AppTr, Button } from '../../../shared/components';
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
  if (trips.length === 0)
    return (
      <div
        className={`rounded-2xl border px-6 py-16 text-center ${
          dark ? 'border-slate-700/80 bg-slate-900/40' : 'border-slate-200/90 bg-white/60 backdrop-blur-sm'
        }`}
      >
        <p className={dark ? 'text-slate-400' : 'text-slate-500'}>No trips match your filters.</p>
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
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  return (
    <AppDataTable
      columns={['Route', 'Driver', 'Vehicle', 'Distance', 'Start', 'Status', 'Actions']}
      totalResults={trips.length}
      dark={dark}
      ariaLabel="Trips table"
    >
      {trips.map((trip) => {
        const isBusy = actionTripId === trip.id;

        return (
          <AppTr key={trip.id}>
            <AppTd className={dark ? 'text-slate-200' : 'text-slate-700'}>
              {trip.startLocation} {'->'} {trip.endLocation}
            </AppTd>

            <AppTd className={dark ? 'text-slate-300' : 'text-slate-600'}>{trip.driver?.name || 'Unassigned'}</AppTd>
            <AppTd className={dark ? 'text-slate-300' : 'text-slate-600'}>
              {trip.vehicle?.name || 'Unknown vehicle'}
            </AppTd>

            <AppTd className={dark ? 'text-slate-300' : 'text-slate-600'}>{trip.distance ?? 0} km</AppTd>

            <AppTd className={dark ? 'text-slate-300' : 'text-slate-600'}>{formatDate(trip.startTime)}</AppTd>

            <AppTd>
              <AppStatusBadge variant={statusVariant(trip.status)}>{trip.status}</AppStatusBadge>
            </AppTd>

            <AppTd>
              <div className="flex flex-wrap items-center gap-2">
                {(trip.status === 'scheduled' || trip.status === 'ongoing') && (
                  <Button type="button" size="sm" variant="secondary" onClick={() => onCancel?.(trip.id)} disabled={isBusy}>
                    Cancel
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