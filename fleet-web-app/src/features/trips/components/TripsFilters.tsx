import { FiSearch } from 'react-icons/fi';
import { Input } from '../../../shared/components';

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
    <select
      value={statusFilter}
      onChange={(e) => onStatusChange(e.target.value)}
      className={`min-w-[160px] rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition focus:ring-2 focus:ring-brand ${
        dark
          ? 'border border-slate-600 bg-slate-800/80 text-slate-200'
          : 'border border-slate-200 bg-white/90 text-slate-800'
      }`}
    >
      <option value="all">All statuses</option>
      <option value="scheduled">Scheduled</option>
      <option value="ongoing">Ongoing</option>
      <option value="completed">Completed</option>
      <option value="cancelled">Cancelled</option>
    </select>
  </div>
);

export default TripsFilters;