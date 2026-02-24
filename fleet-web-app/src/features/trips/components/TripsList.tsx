import { Card } from '../../../shared/components';
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
}

const TripsList = ({ trips }: Props) => {
  if (trips.length === 0)
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-gray-500">No trips found.</p>
        </div>
      </Card>
    );

  return (
    <div className="space-y-4">
      {trips.map(trip => (
        <Card key={trip.id} padding="md">
          <TripCard trip={trip} />
        </Card>
      ))}
    </div>
  );
};

export default TripsList;