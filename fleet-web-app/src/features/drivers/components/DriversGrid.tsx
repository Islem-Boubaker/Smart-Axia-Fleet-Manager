import { Card } from '../../../shared/components';
import DriverCard from './DriverCard';

interface Driver {
  id: string;
  name: string;
  email: string;
  licenseNumber: string;
}

interface Props {
  drivers: Driver[];
  isLoading: boolean;
  onEdit: (driver: Driver) => void;
  onDelete: (id: string) => void;
}

const DriversGrid = ({ drivers, isLoading, onEdit, onDelete }: Props) => {
  if (isLoading) return <div className="text-center py-8">Loading...</div>;

  if (drivers.length === 0)
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-gray-500">No drivers available.</p>
        </div>
      </Card>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {drivers.map(driver => (
        <Card key={driver.id} padding="lg">
          <DriverCard driver={driver} onEdit={onEdit} onDelete={onDelete} />
        </Card>
      ))}
    </div>
  );
};

export default DriversGrid;