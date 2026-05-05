import { useTranslation } from 'react-i18next';
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
}: Props) => {
  const { t } = useTranslation();
  return (
  <div
    className={`relative z-20 flex flex-col lg:flex-row gap-4 rounded-2xl border p-4 ${
      dark ? 'border-slate-700/80 bg-slate-900/40' : 'border-slate-200/90 bg-white/70 backdrop-blur-sm shadow-glass'
    }`}
  >
    <div className="flex-1 relative min-w-0">
      <FiSearch
        className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-slate-500' : 'text-slate-400'}`}
      />
      <Input
        type="text"
        placeholder={t('trips.search_placeholder')}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className={`pl-10 rounded-xl border ${
          dark ? 'border-slate-600 bg-slate-800/80 text-slate-100 placeholder:text-slate-500' : 'border-slate-200 bg-white/80'
        }`}
      />
    </div>
    <div className="w-full lg:w-52 shrink-0">
      <Select
        className="w-full"
        value={statusFilter}
        onChange={onStatusChange}
        dark={dark}
        options={[
          { value: 'all', label: t('trips.all_statuses') },
          { value: 'scheduled', label: t('status.scheduled') },
          { value: 'ongoing', label: t('status.ongoing') },
          { value: 'completed', label: t('status.completed') },
          { value: 'cancelled', label: t('status.cancelled') },
        ]}
      />
    </div>
  </div>
  );
};

export default TripsFilters;