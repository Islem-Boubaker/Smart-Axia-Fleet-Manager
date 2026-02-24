import type { SelectOption } from '../settings.types';

interface Props {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

const SettingsSelect = ({ label, value, options, onChange }: Props) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
