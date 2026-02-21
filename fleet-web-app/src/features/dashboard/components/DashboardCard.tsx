import { memo } from 'react';
import type { IconType } from 'react-icons';
import { Card } from '../../../shared/components';

interface DashboardCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: IconType;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const DashboardCard = memo(({ title, value, change, changeType, icon: Icon, color }: DashboardCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <Card padding="md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className={`text-sm mt-2 ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
            {change} from last month
          </p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="text-2xl" />
        </div>
      </div>
    </Card>
  );
});

DashboardCard.displayName = 'DashboardCard';

export default DashboardCard;
