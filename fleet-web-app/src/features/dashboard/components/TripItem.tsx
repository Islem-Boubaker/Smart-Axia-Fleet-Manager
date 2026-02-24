import { FiMapPin } from 'react-icons/fi';
import { Badge } from '../../../shared/components';
export interface TripType {
  id: string;
  driver: string;
  vehicle: string;
  from: string;
  to: string;
  status: string;
}

interface TripItemProps {
  trip: TripType;
}

export const TripItem = ({ trip }: TripItemProps) => (
  <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <div className="flex items-center justify-between mb-2">
      <p className="font-medium text-gray-900">{trip.driver}</p>
      <Badge variant={trip.status === 'ongoing' ? 'info' : 'success'}>
        {trip.status}
      </Badge>
    </div>
    <div className="flex items-center text-sm text-gray-600">
      <FiMapPin className="mr-1" />
      <span>{trip.from} → {trip.to}</span>
    </div>
    <p className="text-xs text-gray-500 mt-1">Vehicle: {trip.vehicle}</p>
  </div>
);