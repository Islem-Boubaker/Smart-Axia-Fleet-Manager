import { FiSearch } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Input, Select } from '../../../shared/components';

interface Props {
  value: string;
  onChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  scoreFilter: string;
  onScoreChange: (value: string) => void;
  dark?: boolean;
}

const DriversSearch = ({
  value,
  onChange,
  statusFilter,
  onStatusChange,
  scoreFilter,
  onScoreChange,
  dark = false,
}: Props) => {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'en').split('-')[0];
  const fallbackByLang: Record<string, Record<string, string>> = {
    en: {
      allStatuses: 'All statuses',
      active: 'Active',
      inactive: 'Inactive',
      onLeave: 'On leave',
      allScores: 'All scores',
      score90Plus: '90+',
      score80to89: '80-89',
      score70to79: '70-79',
      scoreBelow70: 'Below 70',
    },
    fr: {
      allStatuses: 'Tous les statuts',
      active: 'Actif',
      inactive: 'Inactif',
      onLeave: 'En congé',
      allScores: 'Tous les scores',
      score90Plus: '90+',
      score80to89: '80-89',
      score70to79: '70-79',
      scoreBelow70: 'Moins de 70',
    },
    ar: {
      allStatuses: 'جميع الحالات',
      active: 'نشط',
      inactive: 'غير نشط',
      onLeave: 'في إجازة',
      allScores: 'جميع النقاط',
      score90Plus: '90+',
      score80to89: '80-89',
      score70to79: '70-79',
      scoreBelow70: 'أقل من 70',
    },
  };
  const fallbackSet = fallbackByLang[lang] || fallbackByLang.en;
  const translateOr = (key: string, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const statusOptions = [
    { value: 'all', label: translateOr('drivers.filters.allStatuses', fallbackSet.allStatuses) },
    { value: 'active', label: translateOr('status.active', fallbackSet.active) },
    { value: 'inactive', label: translateOr('status.inactive', fallbackSet.inactive) },
    { value: 'on-leave', label: translateOr('status.on_leave', fallbackSet.onLeave) },
  ];

  const scoreOptions = [
    { value: 'all', label: translateOr('drivers.filters.allScores', fallbackSet.allScores) },
    { value: '90_plus', label: translateOr('drivers.filters.score90Plus', fallbackSet.score90Plus) },
    { value: '80_89', label: translateOr('drivers.filters.score80to89', fallbackSet.score80to89) },
    { value: '70_79', label: translateOr('drivers.filters.score70to79', fallbackSet.score70to79) },
    { value: 'below_70', label: translateOr('drivers.filters.scoreBelow70', fallbackSet.scoreBelow70) },
  ];

  return (
    <div
      className={`flex flex-col sm:flex-row gap-4 rounded-2xl border p-4 ${
        dark ? 'border-slate-700/80 bg-slate-900/40' : 'border-slate-200/90 bg-white/70 backdrop-blur-sm shadow-glass'
      }`}
    >
      <div className="flex-1 relative">
        <FiSearch
          className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-slate-500' : 'text-slate-400'}`}
        />
        <Input
          type="text"
          placeholder={t('drivers.search_placeholder')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`pl-10 rounded-xl border ${
            dark ? 'border-slate-600 bg-slate-800/80 text-slate-100 placeholder:text-slate-500' : 'border-slate-200 bg-white/80'
          }`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:w-[420px] sm:grid-cols-2">
        <div>
          <Select value={statusFilter} onChange={onStatusChange} options={statusOptions} dark={dark} />
        </div>

        <div>
          <Select value={scoreFilter} onChange={onScoreChange} options={scoreOptions} dark={dark} />
        </div>
      </div>
    </div>
  );
};

export default DriversSearch;
