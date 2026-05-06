import { useTranslation } from 'react-i18next';
import type { DashboardFleetStatus } from '../hooks/useDashboard';
import { Badge } from '../../../shared/components';

interface DashboardOverviewProps {
  fleetStatus: DashboardFleetStatus;
}

const DashboardOverview = ({ fleetStatus }: DashboardOverviewProps) => {
  const { t, i18n } = useTranslation();
  const total = Math.max(fleetStatus.total, 1);
  const countLocale = (i18n.language || 'en').split('-')[0] === 'ar' ? 'ar' : (i18n.language || 'en').split('-')[0] === 'fr' ? 'fr-FR' : 'en-TN';

  const blocks = [
    { label: t('dashboard.fleetOverview.onTrip'), count: fleetStatus.onTrip, fill: 'bg-blue-500' },
    { label: t('dashboard.fleetOverview.available'), count: fleetStatus.available, fill: 'bg-emerald-500' },
    { label: t('dashboard.fleetOverview.inMaintenance'), count: fleetStatus.inMaintenance, fill: 'bg-amber-400' },
    { label: t('dashboard.fleetOverview.outOfService'), count: fleetStatus.outOfService, fill: 'bg-red-400' },
  ];

  return (
    <div className="learning-card relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-100/80 dark:bg-sky-900/20 blur-xl" />
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('dashboard.fleetOverview.title')}</h2>
        <Badge variant="default" size="sm">
          {t('common.vehiclesCount', { count: fleetStatus.total.toLocaleString(countLocale) })}
        </Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {blocks.map((block) => {
          const width = Math.max(0, Math.min(100, (block.count / total) * 100));
          return (
            <div key={block.label} className="rounded-2xl border border-gray-200/70 dark:border-gray-700/60 bg-slate-50/80 dark:bg-slate-800/50 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">{block.label}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{block.count.toLocaleString(countLocale)}</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div className={`h-full rounded-full ${block.fill}`} style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardOverview;
