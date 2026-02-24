import { FiPlus } from 'react-icons/fi';
import { Button } from '../../../shared/components';

interface Props {
  onAdd: () => void;
}

const DriversHeader = ({ onAdd }: Props) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
      <p className="text-gray-600 mt-1">Manage your fleet drivers</p>
    </div>
    <Button onClick={onAdd} aria-label="Add new driver">
      <FiPlus className="mr-2" />
      Add Driver
    </Button>
  </div>
);

export default DriversHeader;