interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge = ({ children, variant = 'default', size = 'md', className = '' }: BadgeProps) => {
  const variants = {
    success:
      'border-emerald-300/40 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white dark:border-emerald-400/35 dark:from-emerald-400 dark:to-emerald-500',
    warning:
      'border-amber-300/40 bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 dark:border-amber-300/35 dark:from-amber-300 dark:to-amber-400',
    error:
      'border-rose-300/40 bg-gradient-to-b from-rose-500 to-rose-600 text-white dark:border-rose-400/35 dark:from-rose-400 dark:to-rose-500',
    info:
      'border-blue-300/40 bg-gradient-to-b from-blue-500 to-blue-600 text-white dark:border-blue-400/35 dark:from-blue-400 dark:to-blue-500',
    default:
      'border-slate-300/50 bg-gradient-to-b from-slate-200 to-slate-300 text-slate-800 dark:border-slate-500/40 dark:from-slate-600 dark:to-slate-700 dark:text-slate-100',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold tracking-[0.01em] rounded-full border shadow-[0_1px_2px_rgba(15,23,42,0.18)] dark:shadow-[0_1px_2px_rgba(2,6,23,0.45)] ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};


