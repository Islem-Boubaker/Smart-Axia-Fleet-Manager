import { memo } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Badge, Button } from '../../../shared/components';

interface VehicleCardProps {
  vehicle: any;
  onEdit?: (vehicle: any) => void;
  onDelete?: (id: string) => void;
}

const VehicleCard = memo(({ vehicle, onEdit, onDelete }: VehicleCardProps) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-sm text-gray-500">{vehicle.year}</p>
        </div>
        <Badge
          variant={
            vehicle.status === 'active'
              ? 'success'
              : vehicle.status === 'maintenance'
              ? 'warning'
              : 'default'
          }
        >
          {vehicle.status}
        </Badge>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">License Plate:</span>
          <span className="font-medium text-gray-900">{vehicle.licensePlate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Mileage:</span>
          <span className="font-medium text-gray-900">
            {vehicle.mileage?.toLocaleString()} km
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Fuel Type:</span>
          <span className="font-medium text-gray-900 capitalize">{vehicle.fuelType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Driver:</span>
          <span className="font-medium text-gray-900">{vehicle.driver || 'N/A'}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-200">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => onEdit?.(vehicle)}
        >
          <FiEdit2 className="mr-1" />
          Edit
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete?.(vehicle.id)}
        >
          <FiTrash2 />
        </Button>
      </div>
    </div>
  );
});

VehicleCard.displayName = 'VehicleCard';

export default VehicleCard;
