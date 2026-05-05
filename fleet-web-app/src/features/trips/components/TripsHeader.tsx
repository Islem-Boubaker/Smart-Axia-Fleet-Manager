import { FiPlus } from 'react-icons/fi';
import { Button } from '../../../shared/components';

interface TripsHeaderProps {
  dark?: boolean;
  tripCount?: number;
  onAdd?: () => void;
}

const TripsHeader = ({ tripCount, onAdd }: TripsHeaderProps) => (
  <div className="fleet-hero flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
    <div className="space-y-1">
      <p className="fleet-hero-kicker">
        Operations
      </p>
      <h1 className="fleet-hero-title">
        My trips
      </h1>
      {tripCount !== undefined && (
        <p className="fleet-hero-subtitle">
          {tripCount} trip{tripCount !== 1 ? 's' : ''} in view
        </p>
      )}
    </div>
    <Button className="rounded-full shadow-soft shrink-0" onClick={onAdd}>
      <FiPlus className="mr-2" />
      Schedule trip
    </Button>
  </div>
);

export default TripsHeader;
