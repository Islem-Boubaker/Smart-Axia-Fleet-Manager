import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  dark?: boolean;
}

const PageHeader = ({ title, description, actions }: PageHeaderProps) => {
  return (
    <div className="fleet-hero relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="fleet-hero-kicker">Fleet Manager</p>
        <h1 className="fleet-hero-title">{title}</h1>
        {description && (
          <p className="fleet-hero-subtitle mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;
