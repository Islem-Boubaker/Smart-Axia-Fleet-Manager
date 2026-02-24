import { FiSearch } from 'react-icons/fi';
import { Card, Input } from '../../../shared/components';

interface Props {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
}

const TripsFilters = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange
}: Props) => (
  <Card>
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search trips..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <select
        value={statusFilter}
        onChange={e => onStatusChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All Status</option>
        <option value="scheduled">Scheduled</option>
        <option value="ongoing">Ongoing</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
  </Card>
);

export default TripsFilters;