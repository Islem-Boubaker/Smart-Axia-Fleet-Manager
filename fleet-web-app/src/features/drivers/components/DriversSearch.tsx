import { FiSearch } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Input } from '../../../shared/components';

interface Props {
  value: string;
  onChange: (value: string) => void;
  dark?: boolean;
}

const DriversSearch = ({ value, onChange, dark = false }: Props) => {
  const { t } = useTranslation();
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
    </div>
  );
};

export default DriversSearch;
