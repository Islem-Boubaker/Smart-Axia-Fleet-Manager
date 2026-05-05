import { FiSearch, FiChevronDown } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Input, Select } from '../../../shared/components';
import type { VehicleStatusFilter, VehicleTypeFilter } from '../hooks/useVehicles';

interface ToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter: VehicleStatusFilter;
  onStatusChange: (value: VehicleStatusFilter) => void;
  typeFilter: VehicleTypeFilter;
  onTypeChange: (value: VehicleTypeFilter) => void;
  dark?: boolean;
}

interface FilterChipProps {
  children: React.ReactNode;
  dark?: boolean;
}

export const FilterChip = ({ children, dark = false }: FilterChipProps) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium ${
      dark ? 'border-slate-700 bg-slate-800/70 text-slate-200' : 'border-slate-200 bg-white text-slate-700'
    }`}
  >
    {children}
    <FiChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
  </span>
);

const Toolbar = ({
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  dark = false,
}: ToolbarProps) => {
  const { t } = useTranslation();
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center ${
        dark ? 'border-slate-700/80 bg-slate-900/40' : 'border-slate-200/90 bg-white/80 shadow-glass'
      }`}
    >
      <div className="relative min-w-0 flex-1">
        <FiSearch
          className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${
            dark ? 'text-slate-500' : 'text-slate-400'
          }`}
          aria-hidden="true"
        />
        <Input
          aria-label={t('common.search')}
          type="text"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('vehicles.search_placeholder')}
          className={`pl-10 ${dark ? 'border-slate-700 bg-slate-800/70 text-slate-100' : 'border-slate-200 bg-white'}`}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="min-w-[170px]">
          <Select
            value={typeFilter}
            onChange={(value) => onTypeChange(value as VehicleTypeFilter)}
            dark={dark}
            options={[
              { value: 'all', label: t('vehicles.filter_type', { value: t('vehicles.types.all') }) },
              { value: 'car', label: t('vehicles.filter_type', { value: t('vehicles.types.car') }) },
              { value: 'suv', label: t('vehicles.filter_type', { value: t('vehicles.types.suv') }) },
              { value: 'truck', label: t('vehicles.filter_type', { value: t('vehicles.types.truck') }) },
              { value: 'motorcycle', label: t('vehicles.filter_type', { value: t('vehicles.types.motorcycle') }) },
              { value: 'van', label: t('vehicles.filter_type', { value: t('vehicles.types.van') }) },
            ]}
          />
        </div>

        <div className="min-w-[170px]">
          <Select
            value={statusFilter}
            onChange={(value) => onStatusChange(value as VehicleStatusFilter)}
            dark={dark}
            options={[
              { value: 'all', label: t('vehicles.filter_status', { value: t('common.all') }) },
              { value: 'available', label: t('vehicles.filter_status', { value: t('status.available') }) },
              { value: 'in_use', label: t('vehicles.filter_status', { value: t('status.in_use') }) },
              { value: 'maintenance', label: t('vehicles.filter_status', { value: t('status.maintenance') }) },
              { value: 'inactive', label: t('vehicles.filter_status', { value: t('status.inactive') }) },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
