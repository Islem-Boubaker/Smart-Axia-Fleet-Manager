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
    <div className="group relative overflow-hidden rounded-xl border border-gray-200/70 dark:border-gray-700/60 bg-white/90 dark:bg-gray-900/70 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft">
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${
          accentClassName || 'bg-gradient-to-r from-blue-500 to-cyan-500'
        }`}
      />
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
        {icon ? (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
            {icon}
          </span>
        ) : null}
      </div>
      <p className={`text-2xl font-semibold tracking-tight text-gray-900 dark:text-white ${valueClassName || ''}`}>{value}</p>
    </div>
  );
};

export default DashboardCard;
