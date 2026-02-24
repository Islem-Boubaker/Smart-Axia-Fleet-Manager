import { FiPlus } from 'react-icons/fi';
import { Button } from '../../../shared/components';

interface Props {
  onAdd: () => void;
}

const VehiclesHeader = ({ onAdd }: Props) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
      <p className="text-gray-600 mt-1">Manage your fleet vehicles</p>
    </div>
    <Button onClick={onAdd}>
      <FiPlus className="mr-2" />
      Add Vehicle
    </Button>
  </div>
);

export default VehiclesHeader;