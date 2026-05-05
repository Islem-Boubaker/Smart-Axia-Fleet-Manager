import { useNavigate } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';
import type { Trip } from '../../../types';
import { ROUTES } from '../../../utils/constants';
import TripItem from './TripItem';

interface RecentTripsCardProps {
  trips: Trip[];
  onTripClick?: (trip: Trip) => void;
}

const RecentTripsCard = ({ trips, onTripClick }: RecentTripsCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="learning-card p-5">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => navigate(ROUTES.TRIPS)}
          className="text-sm font-black text-gray-800 dark:text-gray-200 inline-flex items-center gap-1 hover:text-sky-600 dark:hover:text-sky-300 transition-colors"
        >
          Recent trips
          <FiArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {trips.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No recent trips.</p>
      ) : (
        <ul>
          {trips.map((trip) => (
            <TripItem key={trip.id} trip={trip} onClick={onTripClick} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentTripsCard;
