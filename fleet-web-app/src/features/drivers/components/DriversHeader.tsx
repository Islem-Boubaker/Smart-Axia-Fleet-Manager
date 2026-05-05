import { FiPlus } from 'react-icons/fi';
import { Button } from '../../../shared/components';

interface Props {
  onAdd: () => void;
  dark?: boolean;
}

const DriversHeader = ({ onAdd }: Props) => (
  <div className="fleet-hero flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
    <div className="space-y-1">
      <p className="fleet-hero-kicker">
        People
      </p>
      <h1 className="fleet-hero-title">
        Drivers
      </h1>
      <p className="fleet-hero-subtitle max-w-xl">
        Manage your fleet drivers
      </p>
    </div>
    <Button onClick={onAdd} aria-label="Add new driver" className="rounded-full shrink-0 shadow-soft">
      <FiPlus className="mr-2" />
      Add driver
    </Button>
  </div>
);

export default DriversHeader;
