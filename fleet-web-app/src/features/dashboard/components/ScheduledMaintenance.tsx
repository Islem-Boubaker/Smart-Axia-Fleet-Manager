import { useTranslation } from 'react-i18next';
import { Badge } from '../../../shared/components';
import { FiArrowUpRight } from 'react-icons/fi';
import type { Maintenance } from '../../../types';

interface ScheduledMaintenanceProps {
  items: Maintenance[];
  onOpenAll?: () => void;
}

const dayDiff = (dateValue: string) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 999;
  const now = new Date();
  const startNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((startDate.getTime() - startNow.getTime()) / 86400000);
};

const ScheduledMaintenance = ({ items, onOpenAll }: ScheduledMaintenanceProps) => {
  const { t, i18n } = useTranslation();
  const dateLocale = (i18n.language || 'en').split('-')[0] === 'ar' ? 'ar' : (i18n.language || 'en').split('-')[0] === 'fr' ? 'fr-FR' : 'en-GB';

  return (
  <div className="bg-white/90 dark:bg-gray-900/70 rounded-2xl border border-gray-200/70 dark:border-gray-700/60 shadow-sm p-5">
    <div className="mb-3 flex items-center justify-between">
      <button
        type="button"
        onClick={onOpenAll}
        className="text-sm font-medium text-gray-700 dark:text-gray-300 inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
      >
        {t('dashboard.maintenance.title')}
        <FiArrowUpRight className="w-4 h-4" />
      </button>
    </div>

    {items.length === 0 ? (
      <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.maintenance.none')}</p>
    ) : (
      <ul>
        {items.map((item) => {
          const diff = dayDiff(item.scheduledDate);
          const badge =
            diff < 0
              ? { label: t('common.overdue'), variant: 'error' as const }
              : diff <= 5
                ? { label: t('common.soon'), variant: 'warning' as const }
                : { label: t('common.scheduled'), variant: 'success' as const };
          return (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 px-2 rounded-lg border border-transparent hover:border-gray-200/80 dark:hover:border-gray-700/80 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0" />
                <div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                    {t('dashboard.maintenance.typePlate', { type: item.type || t('common.maintenance'), plate: item.vehiclePlate })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t('dashboard.maintenance.scheduledLine', {
                      date: new Date(item.scheduledDate).toLocaleDateString(dateLocale, { day: '2-digit', month: 'short' }),
                    })}
                  </p>
                </div>
              </div>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </li>
          );
        })}
      </ul>
    )}
  </div>
  );
};

export default ScheduledMaintenance;
