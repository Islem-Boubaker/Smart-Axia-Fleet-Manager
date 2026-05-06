import { FiPlus } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/components';

interface TripsHeaderProps {
  dark?: boolean;
  tripCount?: number;
  onAdd?: () => void;
}

const TripsHeader = ({ tripCount, onAdd }: TripsHeaderProps) => {
  const { t } = useTranslation();

  return (
    <div className="fleet-hero flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <p className="fleet-hero-kicker">{t('trips.section_label')}</p>
        <h1 className="fleet-hero-title">{t('trips.title')}</h1>
        {tripCount !== undefined && (
          <p className="fleet-hero-subtitle">
            {tripCount === 1
              ? t('trips.header.tripInView', { count: tripCount })
              : t('trips.header.tripsInView', { count: tripCount })}
          </p>
        )}
      </div>
      <Button className="rounded-full shadow-soft shrink-0" onClick={onAdd}>
        <FiPlus className="mr-2" />
        {t('trips.header.scheduleTrip')}
      </Button>
    </div>
  );
};

export default TripsHeader;
