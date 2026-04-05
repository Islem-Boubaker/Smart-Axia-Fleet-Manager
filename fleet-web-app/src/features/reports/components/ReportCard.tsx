import { memo } from 'react';
import type { IconType } from 'react-icons';

interface ReportCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: IconType;
  color: string;
  dark?: boolean;
}

const ReportCard = memo(({ title, value, change, trend, icon: Icon, color, dark = false }: ReportCardProps) => {
  const colorClasses: any = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0 space-y-1">
        <p className={`text-sm leading-snug ${dark ? 'text-slate-400' : 'text-gray-600'}`}>{title}</p>
        <p className={`text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${dark ? 'text-white' : 'text-gray-900'}`}>
          {value}
        </p>
        <p
          className={`text-sm pt-2 ${
            trend === 'up'
              ? dark
                ? 'text-emerald-400'
                : 'text-green-600'
              : dark
                ? 'text-red-400'
                : 'text-red-600'
          }`}
        >
          {change}
        </p>
      </div>
      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0 ${colorClasses[color]}`}>
        <Icon className="text-2xl" />
      </div>
    </div>
  );
});

ReportCard.displayName = 'ReportCard';

export default ReportCard;
