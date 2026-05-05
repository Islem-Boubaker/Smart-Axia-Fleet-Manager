import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../utils/constants';
import { QuickActionButton } from './ui/QuickActionButton';

const QuickActionsCard = () => {
  const navigate = useNavigate();

  return (
    <div className="learning-card p-5">
      <h2 className="text-sm font-black text-gray-800 dark:text-gray-200 mb-3">Quick actions</h2>
      <div className="space-y-2">
        <QuickActionButton label="+ New Trip" onClick={() => navigate(`${ROUTES.TRIPS}?action=new`)} />
        <QuickActionButton label="+ Add Vehicle" onClick={() => navigate(`${ROUTES.VEHICLES}?action=new`)} />
        <QuickActionButton label="+ Schedule Maintenance" onClick={() => navigate(`${ROUTES.MAINTENANCE}?action=new`)} />
        <QuickActionButton label="Generate Report" onClick={() => navigate(ROUTES.REPORTS)} />
      </div>
    </div>
  );
};

export default QuickActionsCard;
