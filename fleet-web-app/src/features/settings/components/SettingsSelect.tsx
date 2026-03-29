import type { SelectOption } from '../settings.types';

interface Props {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  dark?: boolean;
}

const SettingsSelect = ({ label, value, options, onChange, dark = false }: Props) => (
  <div>
    <label className={`block text-sm font-medium mb-2 ${dark ? 'text-slate-400' : 'text-gray-700'}`}>{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow ${
        dark
          ? 'border-slate-600 bg-slate-800/80 text-slate-100'
          : 'border-gray-300 bg-white text-gray-900'
      }`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export default SettingsSelect;
