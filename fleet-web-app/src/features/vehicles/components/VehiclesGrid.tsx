import { Card } from '../../../shared/components';
import VehicleCard from '../components/VehicleCard';
import type { Vehicle } from '../../../types';

interface Props {
  vehicles: Vehicle[];
  isLoading: boolean;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
}

const VehiclesGrid = ({ vehicles, isLoading, onEdit, onDelete }: Props) => {
  if (isLoading) return <div className="text-center py-8">Loading...</div>;

  if (vehicles.length === 0)
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-gray-500">No vehicles found matching your search.</p>
        </div>
      </Card>
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {vehicles.map(vehicle => (
        <Card key={vehicle.id} padding="md">
          <VehicleCard
            vehicle={vehicle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </Card>
      ))}
    </div>
  );
};

export default VehiclesGrid;
