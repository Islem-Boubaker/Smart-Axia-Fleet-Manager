import { memo } from 'react';
import { FiTruck, FiUser } from 'react-icons/fi';
import { Badge } from '../../../shared/components';

interface TripCardProps {
  trip: any;
}

const TripCard = memo(({ trip }: TripCardProps) => {
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

  return (
    <div className="space-y-4">
      {/* Header with Trip ID and Status */}
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-gray-900">Trip #{trip.id}</h3>
        <Badge variant={getStatusColor(trip.status) as any}>{trip.status}</Badge>
      </div>

      {/* Route Visualization */}
      <div className="flex">
        {/* Timeline dots and line */}
        <div className="flex flex-col items-center mr-4">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <div className="w-0.5 h-16 bg-gray-300 my-1"></div>
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        </div>

        {/* Route details */}
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">{trip.startLocation}</p>
            <p className="text-xs text-gray-500">{trip.startTime}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{trip.endLocation}</p>
            <p className="text-xs text-gray-500">{trip.endTime || 'In Progress'}</p>
          </div>
        </div>

        {/* Stats panel */}
        <div className="ml-4 text-right space-y-1">
          <div>
            <p className="text-xs text-gray-500">Distance</p>
            <p className="text-sm font-semibold text-gray-900">{trip.distance}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Fuel</p>
            <p className="text-sm font-semibold text-gray-900">{trip.fuel}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Cost</p>
            <p className="text-sm font-semibold text-gray-900">{trip.cost}</p>
          </div>
        </div>
      </div>

      {/* Driver and Vehicle Info */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 text-sm">
        <div className="flex items-center text-gray-600">
          <FiUser className="mr-2 text-gray-400" />
          <span>{trip.driver}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <FiTruck className="mr-2 text-gray-400" />
          <span>{trip.vehicle}</span>
        </div>
      </div>
    </div>
  );
});

TripCard.displayName = 'TripCard';

export default TripCard;
