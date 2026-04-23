import type { ReactNode } from 'react';

type AppStatusVariant = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

interface AppStatusBadgeProps {
  children: ReactNode;
  variant?: AppStatusVariant;
}

const variantClasses: Record<AppStatusVariant, string> = {
  success: 'bg-emerald-100 text-emerald-700',
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
  neutral: 'bg-slate-200 text-slate-700',
};

const dotClasses: Record<AppStatusVariant, string> = {
  success: 'bg-emerald-500',
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  neutral: 'bg-slate-500',
};

const AppStatusBadge = ({ children, variant = 'neutral' }: AppStatusBadgeProps) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${variantClasses[variant]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[variant]}`} aria-hidden="true" />
      {children}
    </span>
  );
};

export default AppStatusBadge;
