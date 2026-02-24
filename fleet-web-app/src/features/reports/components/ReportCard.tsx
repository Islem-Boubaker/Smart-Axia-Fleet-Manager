import { memo } from 'react';
import type { IconType } from 'react-icons';

interface ReportCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: IconType;
  color: string;
}

const ReportCard = memo(({ title, value, change, trend, icon: Icon, color }: ReportCardProps) => {
  const colorClasses: any = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className={`text-sm mt-2 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </p>
      </div>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
        <Icon className="text-2xl" />
      </div>
    </div>
  );
});

ReportCard.displayName = 'ReportCard';

export default ReportCard;
