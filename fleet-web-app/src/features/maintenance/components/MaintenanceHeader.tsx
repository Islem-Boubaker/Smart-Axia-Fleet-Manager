import { FiPlus } from 'react-icons/fi';
import { Button } from '../../../shared/components';

interface Props {
  onSchedule: () => void;
  dark?: boolean;
}

export function MaintenanceHeader({ onSchedule, dark = false }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
      <div className="space-y-1">
        <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
          Fleet care
        </p>
        <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
          Maintenance
        </h1>
        <p className={`text-sm sm:text-base max-w-xl leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          Track vehicle maintenance, scheduled service, and records
        </p>
      </div>
      <Button onClick={onSchedule} className="rounded-xl shrink-0 shadow-soft">
        <FiPlus className="mr-2" />
        Schedule maintenance
      </Button>
    </div>
  );
}
