import { Card } from '../../../shared/components';
import VehicleCard from '../components/VehicleCard';
import type { Vehicle } from '../../../types';

interface Props {
  vehicles: Vehicle[];
  isLoading: boolean;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
  dark?: boolean;
}

const VehiclesGrid = ({ vehicles, isLoading, onEdit, onDelete, dark = false }: Props) => {
  if (isLoading)
    return (
      <div className={`text-center py-16 rounded-2xl border ${dark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
        Loading…
      </div>
    );

  if (vehicles.length === 0)
    return (
      <div
        className={`rounded-2xl border px-6 py-16 text-center ${
          dark ? 'border-slate-700/80 bg-slate-900/40' : 'border-slate-200/90 bg-white/60 backdrop-blur-sm'
        }`}
      >
        <p className={dark ? 'text-slate-400' : 'text-slate-500'}>No vehicles found matching your search.</p>
      </div>
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
      {vehicles.map((vehicle) => (
        <Card
          key={vehicle.id}
          padding="lg"
          className={
            dark
              ? 'border-slate-700/80 bg-slate-800/35 backdrop-blur-sm shadow-none'
              : 'border-slate-200/90 bg-white/85 shadow-glass'
          }
        >
          <VehicleCard vehicle={vehicle} onEdit={onEdit} onDelete={onDelete} dark={dark} />
        </Card>
      ))}
    </div>
  );
};

export default VehiclesGrid;
