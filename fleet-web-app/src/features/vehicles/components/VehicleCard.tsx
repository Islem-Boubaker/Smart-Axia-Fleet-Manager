import { memo } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Badge, Button } from '../../../shared/components';
import type { Vehicle } from '../../../types';

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (id: string) => void;
  dark?: boolean;
}

const VehicleCard = memo(({ vehicle, onEdit, onDelete, dark = false }: VehicleCardProps) => {
  const t = dark ? 'text-slate-100' : 'text-gray-900';
  const sub = dark ? 'text-slate-400' : 'text-gray-600';
  const border = dark ? 'border-slate-700' : 'border-gray-200';

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={`text-lg font-semibold truncate ${t}`}>{vehicle.name}</h3>
          <p className={`text-sm capitalize ${sub}`}>
            {vehicle.type} · {vehicle.Vehicle_Model}
          </p>
        </div>
        <div className="flex flex-wrap gap-1 justify-end shrink-0">
          <Badge variant={vehicle.Active ? 'success' : 'default'}>{vehicle.Active ? 'Active' : 'Inactive'}</Badge>
          {vehicle.Need_Maintenance && <Badge variant="warning">Maintenance</Badge>}
        </div>
      </div>

      <div className={`space-y-2 text-sm ${sub}`}>
        <div className="flex justify-between gap-2">
          <span>Plaque</span>
          <span className={`font-medium ${t}`}>{vehicle.plaque_immatriculation || 'N/A'}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Mileage</span>
          <span className={`font-medium tabular-nums ${t}`}>{vehicle.Mileage?.toLocaleString()} km</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Compteur</span>
          <span className={`font-medium tabular-nums ${t}`}>{vehicle.compteur_kilometrique?.toLocaleString()} km</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Maintenance</span>
          <span className={`font-medium ${t}`}>{vehicle.Maintenance_History}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Battery</span>
          <span className={`font-medium ${t}`}>{vehicle.Battery_Status}</span>
        </div>
      </div>

      <div className={`flex gap-2 pt-2 border-t ${border}`}>
        <Button
          variant="secondary"
          size="sm"
          className={`flex-1 rounded-xl ${
            dark ? 'bg-slate-800 border-slate-600 text-slate-100 hover:bg-slate-700' : ''
          }`}
          onClick={() => onEdit?.(vehicle)}
        >
          <FiEdit2 className="mr-1" />
          Edit
        </Button>
        <Button variant="danger" size="sm" className="rounded-xl" onClick={() => onDelete?.(vehicle.id)}>
          <FiTrash2 />
        </Button>
      </div>
    </div>
  );
});

export default VehicleCard;
