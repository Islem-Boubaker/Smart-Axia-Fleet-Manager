import TripCard from '../components/TripCard';
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

const TripsList = ({ trips, dark = false, actionTripId = null, onViewDetails, onEdit, onStart, onReachStop, onComplete, onCancel }: Props) => {
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

  return (
    <div className="space-y-5">
      {trips.map((trip, index) => (
        <TripCard
          key={trip.id}
          trip={trip}
          dark={dark}
          index={index}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onStart={onStart}
          onReachStop={onReachStop}
          onComplete={onComplete}
          onCancel={onCancel}
          isBusy={actionTripId === trip.id}
        />
      ))}
    </div>
  );
};

export default TripsList;