import { memo } from 'react';
import type { IconType } from 'react-icons';

interface ReportCardProps {
  title: string;
  value: string;
  icon: IconType;
  color: string;
  dark?: boolean;
}

const ReportCard = memo(({ title, value, icon: Icon, color, dark = false }: ReportCardProps) => {
  const colorClasses: any = {
    green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300',
    orange: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
    purple: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300',
  };

  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0 space-y-1">
        <p className={`text-xs font-medium uppercase tracking-wide leading-snug ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{title}</p>
        <p className={`text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}>
          {value}
        </p>
      </div>
      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center shrink-0 ${colorClasses[color]}`}>
        <Icon className="text-2xl" />
      </div>
    </div>
  );
});

ReportCard.displayName = 'ReportCard';

export default ReportCard;
