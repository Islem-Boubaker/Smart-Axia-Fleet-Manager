import { memo } from 'react';
import { FiArrowRight, FiTruck, FiUser } from 'react-icons/fi';
import { Badge } from '../../../shared/components';
import type { Trip } from '../../../types';

interface TripCardProps {
  trip: Trip;
  dark?: boolean;
  index?: number;
  isBusy?: boolean;
  onStart?: (tripId: string) => void;
  onComplete?: (tripId: string) => void;
  onCancel?: (tripId: string) => void;
}

const formatDateTime = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const TripCard = memo(({ trip, dark = false, index = 0, isBusy = false, onStart, onComplete, onCancel }: TripCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'ongoing':
        return 'warning';
      case 'scheduled':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const scoreAccent =
    trip.status === 'completed'
      ? 'from-emerald-500 to-brand'
      : trip.status === 'ongoing'
        ? 'from-amber-400 to-amber-600'
        : 'from-slate-300 to-slate-400';

  const metrics: Array<[string, string]> = [
    ['Distance', `${trip.distance ?? 0} km`],
    ['Fuel', trip.fuel ?? 'N/A'],
    ['Cost', trip.cost !== undefined ? `${trip.cost} TND` : 'N/A'],
  ];

  const driverDisplay = trip.driver?.name || 'Unassigned driver';
  const vehicleDisplay = [trip.vehicle?.name, trip.vehicle?.plaque_immatriculation]
    .filter(Boolean)
    .join(' - ') || 'Unknown vehicle';

  const stagger = index % 2 === 1 ? 'lg:ml-12' : '';

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-1 hover:shadow-soft ${
        dark
          ? 'border-slate-700/80 bg-slate-900/45 backdrop-blur-sm'
          : 'border-slate-200/90 bg-white/85 backdrop-blur-sm shadow-glass'
      } ${stagger}`}
    >
      <div className={`absolute right-0 top-0 h-full w-1.5 bg-gradient-to-b ${scoreAccent} opacity-90`} aria-hidden />

      <div className="p-5 sm:p-6 pr-7">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
              Trip #{trip.id}
            </p>
            <h3 className={`mt-1 text-lg font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
              {trip.startLocation}
              <FiArrowRight className="inline mx-2 w-4 h-4 opacity-50 align-[-2px]" />
              {trip.endLocation}
            </h3>
          </div>
          <Badge variant={getStatusColor(trip.status) as 'success' | 'warning' | 'info' | 'error' | 'default'}>
            {trip.status}
          </Badge>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex gap-3">
              <div className={`flex flex-col items-center pt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                <span className="w-px flex-1 min-h-[2.5rem] bg-gradient-to-b from-slate-300 to-slate-300/30 my-1" />
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 ring-4 ring-red-500/15" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className={`text-sm font-semibold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{trip.startLocation}</p>
                  <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-500'}`}>{formatDateTime(trip.startTime)}</p>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{trip.endLocation}</p>
                  <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                    {trip.endTime ? formatDateTime(trip.endTime) : 'In progress'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <dl className={`grid grid-cols-3 gap-3 text-center rounded-xl px-3 py-3 shrink-0 ${dark ? 'bg-slate-800/80' : 'bg-slate-50/90'}`}>
            {metrics.map(([label, val]) => (
              <div key={label}>
                <dt className={`text-[10px] font-semibold uppercase tracking-wide ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {label}
                </dt>
                <dd className={`mt-0.5 text-sm font-bold tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}>{val}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className={`mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t ${dark ? 'border-slate-700/80' : 'border-slate-200/90'}`}>
          <div className={`flex items-center gap-2 text-sm ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
            <FiUser className={dark ? 'text-slate-500' : 'text-slate-400'} />
            <span>{driverDisplay}</span>
          </div>
          <div className={`flex items-center gap-2 text-sm ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
            <FiTruck className={dark ? 'text-slate-500' : 'text-slate-400'} />
            <span>{vehicleDisplay}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {trip.status === 'scheduled' && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onStart?.(trip.id)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg ${dark ? 'bg-emerald-500/20 text-emerald-200' : 'bg-emerald-50 text-emerald-700'} ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Start Trip
            </button>
          )}
          {trip.status === 'ongoing' && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onComplete?.(trip.id)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg ${dark ? 'bg-brand/20 text-brand' : 'bg-brand-light text-brand-deep'} ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Complete Trip
            </button>
          )}
          {(trip.status === 'scheduled' || trip.status === 'ongoing') && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onCancel?.(trip.id)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg ${dark ? 'bg-red-500/20 text-red-200' : 'bg-red-50 text-red-700'} ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Cancel Trip
            </button>
          )}
        </div>
      </div>
    </article>
  );
});

TripCard.displayName = 'TripCard';

export default TripCard;
