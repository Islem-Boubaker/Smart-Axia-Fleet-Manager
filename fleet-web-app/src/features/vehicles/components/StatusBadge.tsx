import type { ReactNode } from 'react';

type StatusVariant = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

interface StatusBadgeProps {
  children: ReactNode;
  variant?: StatusVariant;
}

const variants: Record<StatusVariant, string> = {
  success: 'bg-emerald-100 text-emerald-700',
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
  neutral: 'bg-slate-200 text-slate-700',
};

const dot: Record<StatusVariant, string> = {
  success: 'bg-emerald-500',
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  neutral: 'bg-slate-500',
};

const StatusBadge = ({ children, variant = 'neutral' }: StatusBadgeProps) => {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${variants[variant]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot[variant]}`} aria-hidden="true" />
      {children}
    </span>
  );
};

export default StatusBadge;
