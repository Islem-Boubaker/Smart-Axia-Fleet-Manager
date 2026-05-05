import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../utils/constants';
import { QuickActionButton } from './ui/QuickActionButton';

const QuickActionsCard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="learning-card p-5">
      <h2 className="text-sm font-black text-gray-800 dark:text-gray-200 mb-3">{t('dashboard.quickActions.title')}</h2>
      <div className="space-y-2">
        <QuickActionButton label={t('dashboard.quickActions.newTrip')} onClick={() => navigate(`${ROUTES.TRIPS}?action=new`)} />
        <QuickActionButton label={t('dashboard.quickActions.addVehicle')} onClick={() => navigate(`${ROUTES.VEHICLES}?action=new`)} />
        <QuickActionButton label={t('dashboard.quickActions.scheduleMaintenance')} onClick={() => navigate(`${ROUTES.MAINTENANCE}?action=new`)} />
        <QuickActionButton label={t('dashboard.quickActions.generateReport')} onClick={() => navigate(ROUTES.REPORTS)} />
      </div>
    </div>
  );
};

export default QuickActionsCard;
