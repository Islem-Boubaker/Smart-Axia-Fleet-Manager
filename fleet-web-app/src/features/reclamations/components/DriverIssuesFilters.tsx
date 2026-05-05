import { Input, Select } from '../../../shared/components';
import { useTranslation } from 'react-i18next';
import type { ReclamationStatus } from '../services/reclamations.service';

interface DriverIssuesFiltersProps {
  dark?: boolean;
  statusFilter: 'all' | ReclamationStatus;
  onStatusChange: (status: 'all' | ReclamationStatus) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  driverFilter: string;
  onDriverChange: (value: string) => void;
  vehicleFilter: string;
  onVehicleChange: (value: string) => void;
  driverOptions: Array<{ value: string; label: string }>;
  vehicleOptions: Array<{ value: string; label: string }>;
  statusLabel: Record<ReclamationStatus, string>;
}

const DriverIssuesFilters = ({
  dark = false,
  statusFilter,
  onStatusChange,
  searchQuery,
  onSearchChange,
  driverFilter,
  onDriverChange,
  vehicleFilter,
  onVehicleChange,
  driverOptions,
  vehicleOptions,
  statusLabel,
}: DriverIssuesFiltersProps) => {
  const { t } = useTranslation();
  return (
    <div
      className={`rounded-2xl border p-4 ${
        dark ? 'border-slate-700/80 bg-slate-900/35' : 'border-slate-200/90 bg-white/80 shadow-glass'
      }`}
    >
      <div className="flex flex-wrap gap-2">
        {(['all', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'] as const).map((status) => {
          const active = statusFilter === status;
          const label = status === 'all' ? t('reclamations.filters.all') : statusLabel[status];
          return (
            <button
              key={status}
              type="button"
              onClick={() => onStatusChange(status)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? dark
                    ? 'bg-brand/20 text-brand'
                    : 'bg-brand-light text-brand-deep'
                  : dark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Input
          label={t('reclamations.filters.search_label')}
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('reclamations.filters.search_placeholder')}
        />

        <div>
          <label className="mb-1.5 block text-[13px] text-gray-500 dark:text-slate-400">{t('reclamations.filters.driver_label')}</label>
          <Select dark={dark} value={driverFilter} onChange={onDriverChange} options={driverOptions} />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] text-gray-500 dark:text-slate-400">{t('reclamations.filters.vehicle_label')}</label>
          <Select dark={dark} value={vehicleFilter} onChange={onVehicleChange} options={vehicleOptions} />
        </div>
      </div>
    </div>
  );
};

export default DriverIssuesFilters;
