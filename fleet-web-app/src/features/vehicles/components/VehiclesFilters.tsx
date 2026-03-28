import { FiSearch } from 'react-icons/fi';
import { Card, Input } from '../../../shared/components';

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
  <Card className={dark ? 'bg-slate-800 border-slate-700' : ''}>
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 relative">
        <FiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${dark ? 'text-slate-400' : 'text-gray-400'}`} />
        <Input
          type="text"
          placeholder="Search by name or plate..."
          className={`pl-10 ${dark ? 'bg-slate-900 border-slate-600 text-slate-100 placeholder-slate-400' : ''}`}
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <select
          className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${dark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'border-gray-300 bg-white text-gray-900'}`}
          value={activeFilter}
          onChange={e => onActiveChange(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select
          className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${dark ? 'bg-slate-900 border-slate-600 text-slate-100' : 'border-gray-300 bg-white text-gray-900'}`}
          value={typeFilter}
          onChange={e => onTypeChange(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="voiture">Voiture</option>
          <option value="camion">Camion</option>
          <option value="moto">Moto</option>
          <option value="camionnette">Camionnette</option>
        </select>
      </div>
    </div>
  </Card>
);

export default VehiclesFilters;
