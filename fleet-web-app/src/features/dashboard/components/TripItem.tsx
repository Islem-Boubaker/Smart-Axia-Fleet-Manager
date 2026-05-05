import { useTranslation } from 'react-i18next';
import { Badge } from '../../../shared/components';
import type { Trip } from '../../../types';

interface TripItemProps {
  trip: Trip;
  onClick?: (trip: Trip) => void;
}

const toBadgeVariant = (status: Trip['status']) => {
  if (status === 'completed') return 'success' as const;
  if (status === 'ongoing') return 'info' as const;
  if (status === 'cancelled') return 'error' as const;
  if (status === 'scheduled') return 'warning' as const;
  return 'default' as const;
};

const TripItem = ({ trip, onClick }: TripItemProps) => {
  const { t } = useTranslation();
  const plate = trip.vehicle?.plaque_immatriculation || t('common.noPlate');
  const driverName = trip.driver?.name || t('common.unassigned');
  const statusKey = trip.status as 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  const statusLabel = ['scheduled', 'ongoing', 'completed', 'cancelled'].includes(statusKey)
    ? t(`trips.status.${statusKey}`)
    : trip.status;

  return (
    <li
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick ? () => onClick(trip) : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick(trip);
              }
            }
          : undefined
      }
      className={`flex items-center justify-between py-2.5 px-2 rounded-lg border border-transparent hover:border-gray-200/80 dark:hover:border-gray-700/80 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all ${
        onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/30' : ''
      }`}
    >
      <div>
        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{trip.startLocation} → {trip.endLocation}</p>
        <p className="text-xs text-gray-400">{plate}{t('common.dashBullet')}{driverName}</p>
      </div>
      <Badge variant={toBadgeVariant(trip.status)}>{statusLabel}</Badge>
    </li>
  );
};

export default TripItem;
