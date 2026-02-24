import { FiPlus } from 'react-icons/fi';
import { Button } from '../../../shared/components';

const TripsHeader = () => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Trips</h1>
      <p className="text-gray-600 mt-1">Track and manage trips</p>
    </div>
    <Button>
      <FiPlus className="mr-2" />
      Schedule Trip
    </Button>
  </div>
);

export default TripsHeader;