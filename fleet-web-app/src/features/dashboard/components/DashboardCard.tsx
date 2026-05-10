import type { ReactNode } from 'react';

interface DashboardCardProps {
  label: string;
  value: string;
  valueClassName?: string;
  icon?: ReactNode;
  accentClassName?: string;
}

const DashboardCard = ({
  label,
  value,
  valueClassName,
  icon,
  accentClassName,
}: DashboardCardProps) => {
  return (
    <div className="learning-card group relative overflow-hidden p-3 sm:p-4">
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${
          accentClassName || 'bg-gradient-to-r from-blue-500 to-cyan-500'
        }`}
      />
      <div className="mb-2 sm:mb-3 flex items-start justify-between gap-2">
        <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 leading-tight">{label}</p>
        {icon ? (
          <span className="inline-flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300">
            {icon}
          </span>
        ) : null}
      </div>
      <p className={`text-lg sm:text-2xl font-black tracking-tight text-gray-950 dark:text-white truncate ${valueClassName || ''}`}>{value}</p>
    </div>
  );
};

export default DashboardCard;
