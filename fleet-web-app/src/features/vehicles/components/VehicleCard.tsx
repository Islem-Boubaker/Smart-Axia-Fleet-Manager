import { memo } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Badge, Button } from '../../../shared/components';
import type { Vehicle } from '../../../types';

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (id: string) => void;
  dark?: boolean;
}

const VehicleCard = memo(({ vehicle, onEdit, onDelete, dark = false }: VehicleCardProps) => {
  const navigate = useNavigate();
  const t = dark ? 'text-slate-100' : 'text-gray-900';
  const border = dark ? 'border-slate-700' : 'border-gray-200';

  const getCarImage = (vehicle: Vehicle) => {
    if (vehicle.photos && vehicle.photos.length > 0) return vehicle.photos[0];
    
    switch (vehicle.type?.toLowerCase()) {
      case 'truck':
      case 'van':
        return 'https://images.unsplash.com/photo-1601584115197-04ecc0dacc34?auto=format&fit=crop&q=80&w=800';
      case 'motorcycle':
        return 'https://images.unsplash.com/photo-1558981403-c5f9899a228f?auto=format&fit=crop&q=80&w=800';
      default:
        return 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800';
    }
  };

  return (
    <div 
      className="space-y-4 cursor-pointer group"
      onClick={() => navigate(`/fleet/details/${vehicle.id}`)}
    >
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={getCarImage(vehicle)}
          alt={vehicle.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
             e.currentTarget.src = "https://placehold.co/600x400?text=Vehicle";
          }}
        />
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
          <Badge variant={vehicle.Active ? 'success' : 'default'}>{vehicle.Active ? 'Active' : 'Inactive'}</Badge>
          {vehicle.Need_Maintenance && <Badge variant="warning">Maintenance</Badge>}
        </div>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={`text-xl font-bold truncate ${t}`}>{vehicle.name || vehicle.Vehicle_Model || 'Vehicle'}</h3>
          <p className={`text-sm font-mono mt-1 ${dark ? 'text-slate-400 bg-slate-800/80 border-slate-700' : 'text-slate-600 bg-slate-100 border-slate-200'} border px-2 py-0.5 rounded-md inline-flex`}>
            {vehicle.plaque_immatriculation || 'No Plate'}
          </p>
        </div>
      </div>

      <div className={`flex gap-2 pt-2 border-t ${border}`} onClick={(e) => e.stopPropagation()}>
        <Button
          variant="secondary"
          size="sm"
          className={`flex-1 rounded-xl ${
            dark ? 'bg-slate-800 border-slate-600 text-slate-100 hover:bg-slate-700' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(vehicle);
          }}
        >
          <FiEdit2 className="mr-1" />
          Edit
        </Button>
        <Button 
          variant="danger" 
          size="sm" 
          className="rounded-xl" 
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(vehicle.id);
          }}
        >
          <FiTrash2 />
        </Button>
      </div>
    </div>
  );
});

export default VehicleCard;
