import { FiSave } from 'react-icons/fi';
import { Card, Button } from '../../../shared/components';
import SettingsSelect from './SettingsSelect';
import type { GeneralPreferences, SelectOption } from '../settings.types';

const cardExtra = (dark: boolean) =>
  dark
    ? 'rounded-2xl !border-slate-700/70 !bg-slate-900/40 shadow-soft ring-1 ring-white/[0.06] backdrop-blur-md'
    : 'rounded-2xl !border-slate-200/90 !bg-white/75 shadow-glass backdrop-blur-sm';

const LANGUAGE_OPTIONS: SelectOption[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'ar', label: 'العربية' },
];

const TIMEZONE_OPTIONS: SelectOption[] = [
  { value: 'Africa/Tunis', label: 'Africa/Tunis (GMT+1)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (GMT+1)' },
  { value: 'UTC', label: 'UTC (GMT)' },
];

const DATE_FORMAT_OPTIONS: SelectOption[] = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const DISTANCE_UNIT_OPTIONS: SelectOption[] = [
  { value: 'km', label: 'Kilometers' },
  { value: 'mi', label: 'Miles' },
];

const CURRENCY_OPTIONS: SelectOption[] = [
  { value: 'TND', label: 'TND (Tunisian Dinar)' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
];

interface Props {
  settings: GeneralPreferences;
  onChange: (data: GeneralPreferences) => void;
  dark?: boolean;
}

const GeneralSettings = ({ settings, onChange, dark = false }: Props) => {
  const updateField = (field: keyof GeneralPreferences, value: string) => {
    onChange({ ...settings, [field]: value });
  };

  return (
    <Card
      title="General"
      subtitle="Application preferences"
      dark={dark}
      padding="lg"
      className={cardExtra(dark)}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsSelect
            label="Language"
            value={settings.language}
            options={LANGUAGE_OPTIONS}
            onChange={(value) => updateField('language', value)}
            dark={dark}
          />
          <SettingsSelect
            label="Timezone"
            value={settings.timezone}
            options={TIMEZONE_OPTIONS}
            onChange={(value) => updateField('timezone', value)}
            dark={dark}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SettingsSelect
            label="Date format"
            value={settings.dateFormat}
            options={DATE_FORMAT_OPTIONS}
            onChange={(value) => updateField('dateFormat', value)}
            dark={dark}
          />
          <SettingsSelect
            label="Distance unit"
            value={settings.distanceUnit}
            options={DISTANCE_UNIT_OPTIONS}
            onChange={(value) => updateField('distanceUnit', value)}
            dark={dark}
          />
          <SettingsSelect
            label="Currency"
            value={settings.currency}
            options={CURRENCY_OPTIONS}
            onChange={(value) => updateField('currency', value)}
            dark={dark}
          />
        </div>
        <div className="flex justify-end pt-2">
          <Button className="rounded-xl">
            <FiSave className="mr-2" />
            Save changes
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default GeneralSettings;
