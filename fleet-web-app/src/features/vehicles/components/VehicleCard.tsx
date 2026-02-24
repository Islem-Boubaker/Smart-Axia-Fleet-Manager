import { memo } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Badge, Button } from '../../../shared/components';
import type { Vehicle } from '../../../types';

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (id: string) => void;
}

const VehicleCard = memo(({ vehicle, onEdit, onDelete }: VehicleCardProps) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{vehicle.name}</h3>
          <p className="text-sm text-gray-500 capitalize">{vehicle.type} &middot; {vehicle.Vehicle_Model}</p>
        </div>
        <div className="flex gap-1">
          <Badge variant={vehicle.Active ? 'success' : 'default'}>
            {vehicle.Active ? 'Active' : 'Inactive'}
          </Badge>
          {vehicle.Need_Maintenance && (
            <Badge variant="warning">Maintenance</Badge>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Plaque:</span>
          <span className="font-medium text-gray-900">{vehicle.plaque_immatriculation || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Mileage:</span>
          <span className="font-medium text-gray-900">{vehicle.Mileage?.toLocaleString()} km</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Compteur:</span>
          <span className="font-medium text-gray-900">{vehicle.compteur_kilometrique?.toLocaleString()} km</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Maintenance:</span>
          <span className="font-medium text-gray-900">{vehicle.Maintenance_History}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Battery:</span>
          <span className="font-medium text-gray-900">{vehicle.Battery_Status}</span>
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

export default VehicleCard;
