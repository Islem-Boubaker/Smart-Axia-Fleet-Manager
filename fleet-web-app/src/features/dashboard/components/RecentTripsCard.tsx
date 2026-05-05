import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="bg-white/90 dark:bg-gray-900/70 rounded-2xl border border-gray-200/70 dark:border-gray-700/60 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => navigate(ROUTES.TRIPS)}
          className="text-sm font-medium text-gray-700 dark:text-gray-300 inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
        >
          {t('dashboard.recentTrips.title')}
          <FiArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {trips.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.recentTrips.none')}</p>
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
