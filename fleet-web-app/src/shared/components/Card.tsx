import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Glass / slate styling for dark theme pages */
  dark?: boolean;
}

export const Card = ({
  children,
  title,
  subtitle,
  actions,
  className = '',
  padding = 'md',
  dark = false,
}: CardProps) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const shell = dark
    ? 'bg-slate-800/40 border-slate-700/80 shadow-none backdrop-blur-sm'
    : 'bg-white border-gray-200 shadow-sm';

  const headerRule = dark ? 'border-slate-700' : 'border-gray-200';

  return (
    <div className={`rounded-xl border ${shell} ${className}`}>
      {(title || subtitle || actions) && (
        <div className={`border-b ${headerRule} ${paddingClasses[padding]} flex items-center justify-between`}>
          <div>
            {title && (
              <h3 className={`text-lg font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
            )}
            {subtitle && (
              <p className={`text-sm mt-1 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{subtitle}</p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className={paddingClasses[padding]}>{children}</div>
    </div>
  );
};

export default Card;
