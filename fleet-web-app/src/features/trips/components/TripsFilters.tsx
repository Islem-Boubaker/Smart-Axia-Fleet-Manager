import { FiSearch } from 'react-icons/fi';
import { Input, Select } from '../../../shared/components';

interface Props {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  dark?: boolean;
}

const TripsFilters = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dark = false,
}: Props) => (
  <div
    className={`flex flex-col lg:flex-row gap-4 rounded-2xl border p-4 ${
      dark ? 'border-slate-700/80 bg-slate-900/40' : 'border-slate-200/90 bg-white/70 backdrop-blur-sm shadow-glass'
    }`}
  >
    <div className="flex-1 relative">
      <FiSearch
        className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-slate-500' : 'text-slate-400'}`}
      />
      <Input
        type="text"
        placeholder="Search drivers, vehicles, cities…"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className={`pl-10 rounded-xl border ${
          dark ? 'border-slate-600 bg-slate-800/80 text-slate-100 placeholder:text-slate-500' : 'border-slate-200 bg-white/80'
        }`}
      />
    </div>
    <Select
      className="min-w-[160px]"
      value={statusFilter}
      onChange={onStatusChange}
      dark={dark}
      options={[
        { value: 'all', label: 'All statuses' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'ongoing', label: 'Ongoing' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ]}
    />
  </div>
);

export default TripsFilters;