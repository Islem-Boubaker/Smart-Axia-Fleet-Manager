import { FiSearch } from 'react-icons/fi';
import { Input } from '../../../shared/components';

interface Props {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeFilter: string;
  onActiveChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  dark?: boolean;
}

const VehiclesFilters = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onActiveChange,
  typeFilter,
  onTypeChange,
  dark = false,
}: Props) => (
  <div
    className={`flex flex-col lg:flex-row gap-4 rounded-2xl border p-4 ${
      dark ? 'border-slate-700/80 bg-slate-900/40' : 'border-slate-200/90 bg-white/70 backdrop-blur-sm shadow-glass'
    }`}
  >
    <div className="flex-1 relative min-w-0">
      <FiSearch
        className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-slate-500' : 'text-slate-400'}`}
      />
      <Input
        type="text"
        placeholder="Search by name or plate…"
        className={`pl-10 rounded-xl border ${
          dark ? 'border-slate-600 bg-slate-800/80 text-slate-100 placeholder:text-slate-500' : 'border-slate-200 bg-white/80'
        }`}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 shrink-0">
      <select
        className={`min-w-[140px] px-4 py-3 rounded-xl text-sm font-medium outline-none border transition focus:ring-2 focus:ring-brand ${
          dark ? 'border-slate-600 bg-slate-800/80 text-slate-200' : 'border-slate-200 bg-white/90 text-slate-800'
        }`}
        value={activeFilter}
        onChange={(e) => onActiveChange(e.target.value)}
      >
        <option value="all">All status</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>
      <select
        className={`min-w-[140px] px-4 py-3 rounded-xl text-sm font-medium outline-none border transition focus:ring-2 focus:ring-brand ${
          dark ? 'border-slate-600 bg-slate-800/80 text-slate-200' : 'border-slate-200 bg-white/90 text-slate-800'
        }`}
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value)}
      >
        <option value="all">All types</option>
        <option value="car">Car</option>
        <option value="truck">Truck</option>
        <option value="motorcycle">Motorcycle</option>
        <option value="van">Van</option>
      </select>
    </div>
  </div>
);

export default VehiclesFilters;
