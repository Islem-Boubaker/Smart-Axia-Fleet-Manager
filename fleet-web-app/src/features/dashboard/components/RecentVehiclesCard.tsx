
import { Card} from '../../../shared/components';
import type { VehicleType } from './VehicleItem';
import { VehicleItem } from './VehicleItem';

interface Props {
  vehicles: VehicleType[];
}

const RecentVehiclesCard = ({ vehicles }: Props) => (
  <Card title="Recent Vehicles" subtitle="Your latest vehicle activity">
    <div className="space-y-3">
      {vehicles.map((vehicle) => (
        <VehicleItem key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  </Card>
);

export default RecentVehiclesCard;
