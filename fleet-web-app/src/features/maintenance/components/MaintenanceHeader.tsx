import { FiPlus } from 'react-icons/fi';
import { Button } from '../../../shared/components';

interface Props {
  onSchedule: () => void;
  dark?: boolean;
}

export function MaintenanceHeader({ onSchedule }: Props) {
  return (
    <div className="fleet-hero flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
      <div className="space-y-1">
        <p className="fleet-hero-kicker">
          Fleet care
        </p>
        <h1 className="fleet-hero-title">
          Maintenance
        </h1>
        <p className="fleet-hero-subtitle max-w-xl">
          Track vehicle maintenance, scheduled service, and records
        </p>
      </div>
      <Button onClick={onSchedule} className="rounded-full shrink-0 shadow-soft">
        <FiPlus className="mr-2" />
        Schedule maintenance
      </Button>
    </div>
  );
}
