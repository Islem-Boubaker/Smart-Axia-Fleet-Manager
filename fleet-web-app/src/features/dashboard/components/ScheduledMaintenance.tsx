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

const ScheduledMaintenance = ({ items, onOpenAll }: ScheduledMaintenanceProps) => (
  <div className="learning-card p-5">
    <div className="mb-3 flex items-center justify-between">
      <button
        type="button"
        onClick={onOpenAll}
        className="text-sm font-black text-gray-800 dark:text-gray-200 inline-flex items-center gap-1 hover:text-sky-600 dark:hover:text-sky-300 transition-colors"
      >
        Upcoming maintenance
        <FiArrowUpRight className="w-4 h-4" />
      </button>
    </div>

    {items.length === 0 ? (
      <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming maintenance in the next 14 days.</p>
    ) : (
      <ul>
        {items.map((item) => {
          const diff = dayDiff(item.scheduledDate);
          const badge = diff < 0 ? { label: 'Overdue', variant: 'error' as const } : diff <= 5 ? { label: 'Soon', variant: 'warning' as const } : { label: 'Scheduled', variant: 'success' as const };
          return (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 px-2 rounded-lg border border-transparent hover:border-gray-200/80 dark:hover:border-gray-700/80 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0" />
                <div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{item.type || 'Maintenance'} — {item.vehiclePlate}</p>
                  <p className="text-xs text-gray-400">Scheduled: {new Date(item.scheduledDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
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

export default ScheduledMaintenance;
