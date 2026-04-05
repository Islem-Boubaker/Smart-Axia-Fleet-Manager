import TripCard from '../components/TripCard';

interface Trip {
  id: string;
  driver: string;
  vehicle: string;
  startLocation: string;
  endLocation: string;
  startTime: string;
  endTime: string | null;
  distance: string;
  status: string;
  fuel: string;
  cost: string;
}

interface Props {
  trips: Trip[];
  dark?: boolean;
}

const TripsList = ({ trips, dark = false }: Props) => {
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
        <TripCard key={trip.id} trip={trip} dark={dark} index={index} />
      ))}
    </div>
  );
};

export default TripsList;