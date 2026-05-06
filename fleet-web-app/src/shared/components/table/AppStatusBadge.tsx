import type { ReactNode } from 'react';

type AppStatusVariant = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

interface AppStatusBadgeProps {
  children: ReactNode;
  variant?: AppStatusVariant;
}

const variantClasses: Record<AppStatusVariant, string> = {
  success: 'bg-white text-emerald-500 ring-1 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-300/20',
  info: 'bg-blue-100 text-blue-600 ring-1 ring-blue-100 dark:bg-cyan-300/10 dark:text-cyan-200 dark:ring-cyan-200/20',
  warning: 'bg-orange-500 text-white ring-1 ring-orange-400/40 dark:bg-orange-500/90 dark:text-white dark:ring-orange-300/20',
  danger: 'bg-white text-rose-500 ring-1 ring-rose-100 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-300/20',
  neutral: 'bg-white text-slate-500 ring-1 ring-slate-100 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-300/15',
};

const AppStatusBadge = ({ children, variant = 'neutral' }: AppStatusBadgeProps) => {
  return (
    <span
      className={`inline-flex min-w-[64px] items-center justify-center rounded-full px-3 py-1 text-xs font-bold capitalize leading-none ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
};

export default AppStatusBadge;
