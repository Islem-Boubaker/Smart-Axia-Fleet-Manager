import { FiPlus } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/components';

interface Props {
  onSchedule: () => void;
  dark?: boolean;
}

export function MaintenanceHeader({ onSchedule }: Props) {
  const { t } = useTranslation();

  return (
    <div className="fleet-hero flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
      <div className="space-y-1">
        <p className="fleet-hero-kicker">{t('maintenance.sectionLabel')}</p>
        <h1 className="fleet-hero-title">{t('maintenance.title')}</h1>
        <p className="fleet-hero-subtitle max-w-xl">
          {t('maintenance.subtitle')}
        </p>
      </div>
      <Button onClick={onSchedule} className="rounded-full shrink-0 shadow-soft">
        <FiPlus className="mr-2" />
        {t('maintenance.add')}
      </Button>
    </div>
  );
}
