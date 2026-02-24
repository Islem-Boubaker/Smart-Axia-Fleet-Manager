    
import { Card} from '../../../shared/components';
import { TripItem, type TripType } from './TripItem';

interface Props {
  trips: TripType[];
}

const RecentTripsCard = ({ trips }: Props) => (
  <Card title="Recent Trips" subtitle="Latest trip activities">
    <div className="space-y-3">
      {trips.map((trip) => (
        <TripItem key={trip.id} trip={trip} />
      ))}
    </div>
  </Card>
);

export default RecentTripsCard;
