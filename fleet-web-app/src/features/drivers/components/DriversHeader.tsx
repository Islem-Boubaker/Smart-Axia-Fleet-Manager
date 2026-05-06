import { FiPlus } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/components';

interface Props {
  onAdd: () => void;
  dark?: boolean;
}

const DriversHeader = ({ onAdd }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="fleet-hero flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <p className="fleet-hero-kicker">{t('drivers.section_label')}</p>
        <h1 className="fleet-hero-title">{t('drivers.title')}</h1>
        <p className="fleet-hero-subtitle max-w-xl">{t('drivers.subtitle')}</p>
      </div>
      <Button onClick={onAdd} aria-label={t('drivers.addAria')} className="rounded-full shrink-0 shadow-soft">
        <FiPlus className="mr-2" />
        {t('drivers.addButton')}
      </Button>
    </div>
  );
};

export default DriversHeader;
