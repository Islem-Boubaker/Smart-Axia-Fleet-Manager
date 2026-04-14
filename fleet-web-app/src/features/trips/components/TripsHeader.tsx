import { FiPlus } from 'react-icons/fi';
import { Button } from '../../../shared/components';

interface TripsHeaderProps {
  dark?: boolean;
  tripCount?: number;
  onAdd?: () => void;
}

const TripsHeader = ({ dark = false, tripCount, onAdd }: TripsHeaderProps) => (
  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
    <div className="space-y-1">
      <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
        Operations
      </p>
      <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
        My trips
      </h1>
      {tripCount !== undefined && (
        <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          {tripCount} trip{tripCount !== 1 ? 's' : ''} in view
        </p>
      )}
    </div>
    <Button className="rounded-xl shadow-soft shrink-0" onClick={onAdd}>
      <FiPlus className="mr-2" />
      Schedule trip
    </Button>
  </div>
);

export default TripsHeader;