import { FiPlus } from 'react-icons/fi';
import { Button } from '../../../shared/components';

interface Props {
  onAdd: () => void;
  dark?: boolean;
}

const VehiclesHeader = ({ onAdd, dark = false }: Props) => (
  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
    <div className="space-y-1">
      <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
        Fleet
      </p>
      <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
        Vehicles
      </h1>
      <p className={`text-sm sm:text-base max-w-xl leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
        Manage your fleet vehicles
      </p>
    </div>
    <Button onClick={onAdd} className="rounded-xl shrink-0 shadow-soft">
      <FiPlus className="mr-2" />
      Add vehicle
    </Button>
  </div>
);

export default VehiclesHeader;
