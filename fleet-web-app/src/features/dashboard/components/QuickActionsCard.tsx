import { FiTruck, FiUsers, FiMapPin, FiTrendingUp } from 'react-icons/fi';
import { Card } from '../../../shared/components';
import { QuickActionButton } from './ui/QuickActionButton';
import type { IconType } from 'react-icons';

interface QuickAction {
  label: string;
  icon: IconType;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const actions: QuickAction[] = [
  { label: 'Add Vehicle', icon: FiTruck, color: 'blue' },
  { label: 'Add Driver', icon: FiUsers, color: 'green' },
  { label: 'New Trip', icon: FiMapPin, color: 'purple' },
  { label: 'View Reports', icon: FiTrendingUp, color: 'orange' },
];

const QuickActionsCard = () => (
  <Card title="Quick Actions">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action) => (
        <QuickActionButton
          key={action.label}
          icon={action.icon}
          label={action.label}
          color={action.color}
        />
      ))}
    </div>
  </Card>
);

export default QuickActionsCard;