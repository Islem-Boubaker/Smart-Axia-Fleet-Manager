import { memo } from 'react';
import { FiArrowRight, FiTruck, FiUser } from 'react-icons/fi';
import { Badge } from '../../../shared/components';
import type { Trip } from '../../../types';
import { compactLocationLabel } from '../utils/locationLabel';

interface TripCardProps {
  trip: Trip;
  dark?: boolean;
  index?: number;
  isBusy?: boolean;
  onViewDetails?: (trip: Trip) => void;
  onEdit?: (trip: Trip) => void;
  onStart?: (tripId: string) => void;
  onReachStop?: (tripId: string, stopId: string) => void;
  onComplete?: (tripId: string) => void;
  onCancel?: (tripId: string) => void;
}

const formatDateTime = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatFuel = (trip: Trip) => {
  const fuel = trip.fuel;
  if (typeof fuel === 'number' && Number.isFinite(fuel)) {
    return `${fuel.toFixed(1)} L`;
  }

  const distance = typeof trip.distance === 'number' ? trip.distance : Number(trip.distance);
  const consumption = trip.vehicle?.consumption;
  if (Number.isFinite(distance) && Number.isFinite(consumption) && distance > 0 && Number(consumption) > 0) {
    const estimated = (distance * Number(consumption)) / 100;
    return `${estimated.toFixed(1)} L (est.)`;
  }

  const legacyValue = fuel as unknown;
  if (typeof legacyValue === 'string' && legacyValue.trim().length > 0) {
    return legacyValue;
  }

  return 'N/A';
};

const TripCard = memo(({ trip, dark = false, index = 0, isBusy = false, onViewDetails, onEdit, onStart, onReachStop, onComplete, onCancel }: TripCardProps) => {
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
    ['Fuel', formatFuel(trip)],
    ['Revenue', trip.revenue !== undefined ? `${trip.revenue} TND` : 'N/A'],
  ];

  const driverDisplay = trip.driver?.name || 'Unassigned driver';
  const vehicleDisplay = [trip.vehicle?.name, trip.vehicle?.plaque_immatriculation]
    .filter(Boolean)
    .join(' - ') || 'Unknown vehicle';

  const orderedStops = Array.isArray(trip.stops)
    ? [...trip.stops].sort((a, b) => a.stopOrder - b.stopOrder)
    : [];
  const nextPendingStop = orderedStops.find((stop) => stop.status === 'pending');
  const nextPendingStopId = nextPendingStop?.id;
  const activeStopId =
    nextPendingStopId || (trip.status === 'ongoing' && orderedStops.length > 0 ? orderedStops[orderedStops.length - 1].id : undefined);
  const hasStops = orderedStops.length > 0;
  const canMarkStopReached = trip.status === 'ongoing' && Boolean(nextPendingStop);
  const canFinishLastStep = trip.status === 'ongoing' && hasStops && !nextPendingStop;
  const canCompleteTrip = trip.status === 'ongoing' && !hasStops;

  const compactEndLocation = compactLocationLabel(trip.endLocation).trim().toLowerCase();
  const compactLastStopLocation = orderedStops.length > 0
    ? compactLocationLabel(orderedStops[orderedStops.length - 1].locationName).trim().toLowerCase()
    : null;
  const hasDuplicateLastStop = Boolean(compactLastStopLocation && compactLastStopLocation === compactEndLocation);
  const timelineStops = hasDuplicateLastStop ? orderedStops.slice(0, -1) : orderedStops;

  const routePoints: Array<{
    id: string;
    title: string;
    subtitle: string;
    kind: 'start' | 'stop' | 'end';
    stopState?: 'pending' | 'reached' | 'skipped';
    isActiveStop?: boolean;
  }> = [
    {
      id: `start-${trip.id}`,
      title: compactLocationLabel(trip.startLocation),
      subtitle: formatDateTime(trip.startTime),
      kind: 'start',
    },
    ...timelineStops.map((stop) => {
      const isActiveStop = stop.id === activeStopId;
      const subtitle = stop.status === 'reached'
        ? `Reached ${formatDateTime(stop.arrivalTime)}`
        : stop.status === 'skipped'
          ? 'Skipped'
          : isActiveStop
            ? 'Next stop'
            : 'Upcoming';

      return {
        id: stop.id,
        title: compactLocationLabel(stop.locationName),
        subtitle,
        kind: 'stop' as const,
        stopState: stop.status,
        isActiveStop,
      };
    }),
    {
      id: `end-${trip.id}`,
      title: compactLocationLabel(trip.endLocation),
      subtitle: trip.endTime ? formatDateTime(trip.endTime) : trip.status === 'completed' ? 'Reached destination' : 'Final destination',
      kind: 'end',
    },
  ];

  const stagger = index % 2 === 1 ? 'lg:ml-12' : '';

  return (
    <article
      role={onViewDetails ? 'button' : undefined}
      tabIndex={onViewDetails ? 0 : undefined}
      onClick={onViewDetails ? () => onViewDetails(trip) : undefined}
      onKeyDown={
        onViewDetails
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onViewDetails(trip);
              }
            }
          : undefined
      }
      className={`relative overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-1 hover:shadow-soft ${
        dark
          ? 'border-slate-700/80 bg-slate-900/45 backdrop-blur-sm'
          : 'border-slate-200/90 bg-white/85 backdrop-blur-sm shadow-glass'
      } ${stagger} ${onViewDetails ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/40' : ''}`}
    >
      <div className={`absolute right-0 top-0 h-full w-1.5 bg-gradient-to-b ${scoreAccent} opacity-90`} aria-hidden />

      <div className="p-5 sm:p-6 pr-7">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
              Trip #{trip.id}
            </p>
            <h3 className={`mt-1 text-lg font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
              {compactLocationLabel(trip.startLocation)}
              <FiArrowRight className="inline mx-2 w-4 h-4 opacity-50 align-[-2px]" />
              {compactLocationLabel(trip.endLocation)}
            </h3>
          </div>
          <Badge variant={getStatusColor(trip.status) as 'success' | 'warning' | 'info' | 'error' | 'default'}>
            {trip.status}
          </Badge>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end gap-6">
          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              {routePoints.map((point, pointIndex) => {
                const isLast = pointIndex === routePoints.length - 1;
                const isStart = point.kind === 'start';

                const dotClass = isStart
                  ? 'bg-emerald-500 ring-emerald-500/20'
                  : point.kind === 'stop'
                    ? point.isActiveStop
                      ? 'bg-red-500 ring-red-500/20'
                      : point.stopState === 'reached' || point.stopState === 'skipped'
                        ? dark
                          ? 'bg-slate-500 ring-slate-500/20'
                          : 'bg-slate-400 ring-slate-400/20'
                        : dark
                          ? 'bg-slate-600 ring-slate-600/20'
                          : 'bg-slate-300 ring-slate-300/20'
                    : trip.status === 'completed'
                      ? 'bg-emerald-500 ring-emerald-500/20'
                      : hasStops
                        ? dark
                          ? 'bg-slate-600 ring-slate-600/20'
                          : 'bg-slate-300 ring-slate-300/20'
                        : trip.status === 'ongoing'
                          ? 'bg-red-500 ring-red-500/20'
                          : dark
                            ? 'bg-slate-600 ring-slate-600/20'
                            : 'bg-slate-300 ring-slate-300/20';

                const connectorClass = isStart
                  ? 'bg-emerald-400/60'
                  : point.kind === 'stop' && point.isActiveStop
                    ? 'bg-red-400/60'
                    : dark
                      ? 'bg-slate-600/70'
                      : 'bg-slate-300/80';

                const subtitleClass = point.kind === 'stop' && point.isActiveStop
                  ? dark
                    ? 'text-red-300'
                    : 'text-red-700'
                  : dark
                    ? 'text-slate-500'
                    : 'text-slate-500';

                return (
                  <div key={point.id} className="flex gap-3">
                    <div className={`flex flex-col items-center pt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ring-4 ${dotClass}`} />
                      {!isLast && <span className={`w-px h-7 my-1 ${connectorClass}`} />}
                    </div>
                    <div className="pb-1">
                      <p className={`text-sm font-semibold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{point.title}</p>
                      <p className={`text-xs ${subtitleClass}`}>{point.subtitle}</p>
                    </div>
                  </div>
                );
              })}
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
              onClick={(event) => {
                event.stopPropagation();
                onStart?.(trip.id);
              }}
              className={`px-3 py-2 text-xs font-semibold whitespace-nowrap rounded-lg ${dark ? 'bg-emerald-500/20 text-emerald-200' : 'bg-emerald-50 text-emerald-700'} ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Start Trip
            </button>
          )}
          {canMarkStopReached && nextPendingStop && (
            <button
              type="button"
              disabled={isBusy}
              onClick={(event) => {
                event.stopPropagation();
                onReachStop?.(trip.id, nextPendingStop.id);
              }}
              className={`px-3 py-2 text-xs font-semibold whitespace-nowrap rounded-lg ${dark ? 'bg-sky-500/20 text-sky-200' : 'bg-sky-50 text-sky-700'} ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Stop Reached
            </button>
          )}
          {canFinishLastStep && (
            <button
              type="button"
              disabled={isBusy}
              onClick={(event) => {
                event.stopPropagation();
                onComplete?.(trip.id);
              }}
              className={`px-3 py-2 text-xs font-semibold whitespace-nowrap rounded-lg ${dark ? 'bg-sky-500/20 text-sky-200' : 'bg-sky-50 text-sky-700'} ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Stop Reached
            </button>
          )}
          {canCompleteTrip && (
            <button
              type="button"
              disabled={isBusy}
              onClick={(event) => {
                event.stopPropagation();
                onComplete?.(trip.id);
              }}
              className={`px-3 py-2 text-xs font-semibold whitespace-nowrap rounded-lg ${dark ? 'bg-brand/20 text-brand' : 'bg-brand-light text-brand-deep'} ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Complete Trip
            </button>
          )}
          {(trip.status === 'scheduled' || trip.status === 'ongoing') && (
            <button
              type="button"
              disabled={isBusy}
              onClick={(event) => {
                event.stopPropagation();
                onEdit?.(trip);
              }}
              className={`px-3 py-2 text-xs font-semibold whitespace-nowrap rounded-lg ${dark ? 'bg-amber-500/20 text-amber-200' : 'bg-amber-50 text-amber-700'} ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Edit
            </button>
          )}
          {(trip.status === 'scheduled' || trip.status === 'ongoing') && (
            <button
              type="button"
              disabled={isBusy}
              onClick={(event) => {
                event.stopPropagation();
                onCancel?.(trip.id);
              }}
              className={`px-3 py-2 text-xs font-semibold whitespace-nowrap rounded-lg ${dark ? 'bg-red-500/20 text-red-200' : 'bg-red-50 text-red-700'} ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
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
