import { FiTruck } from 'react-icons/fi';
import { Badge } from '../../../shared/components';
export interface VehicleType {
  id: string;
  name: string;
  plate: string;
  status: string;
  driver: string;
}

interface VehicleItemProps {
  vehicle: VehicleType;
}

export const VehicleItem = ({ vehicle }: VehicleItemProps) => {
  const getVariant = () => {
    if (vehicle.status === 'active') return 'success';
    if (vehicle.status === 'maintenance') return 'warning';
    return 'default';
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <FiTruck className="text-white" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{vehicle.name}</p>
          <p className="text-sm text-gray-500">{vehicle.plate}</p>
        </div>
      </div>
      <div className="text-right">
        <Badge variant={getVariant()}>
          {vehicle.status}
        </Badge>
        <p className="text-xs text-gray-500 mt-1">{vehicle.driver}</p>
      </div>
    </div>
  );
};
