import { useNavigate } from 'react-router-dom';
import type { NotificationRecord } from '../../../shared/services/notification.api';
import { ROUTES } from '../../../utils/constants';
import { Badge } from '../../../shared/components';

interface DashboardAlertsProps {
  alerts: NotificationRecord[];
  onAlertClick?: (alert: NotificationRecord) => void;
}

const alertColorClass = (notification: NotificationRecord) => {
  const text = `${notification.title} ${notification.message}`.toLowerCase();
  if (text.includes('overdue') || text.includes('past due')) return 'bg-red-400';
  if (text.includes('expire') || text.includes('expiring') || text.includes('soon') || text.includes('due')) return 'bg-amber-400';
  return 'bg-blue-400';
};

const alertSubDetail = (notification: NotificationRecord) => {
  const created = new Date(notification.createdAt);
  if (Number.isNaN(created.getTime())) return 'Active alert';
  return created.toLocaleDateString('en-GB');
};

const DashboardAlerts = ({ alerts, onAlertClick }: DashboardAlertsProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white/90 dark:bg-gray-900/70 rounded-2xl border border-gray-200/70 dark:border-gray-700/60 shadow-sm p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Active alerts</h2>
        <Badge variant={alerts.length > 0 ? 'error' : 'default'} size="sm">
          {alerts.length}
        </Badge>
      </div>

      {alerts.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No active alerts.</p>
      ) : (
        <ul>
          {alerts.slice(0, 5).map((alert, index) => (
            <li
              key={alert.id}
              className={`group flex items-start gap-3 py-2.5 px-2 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${index < Math.min(alerts.length, 5) - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
            >
              <button
                type="button"
                onClick={() => onAlertClick?.(alert)}
                className="flex w-full items-start gap-3 text-left"
              >
                <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${alertColorClass(alert)}`} />
                <div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">
                    {alert.title || alert.message}
                  </p>
                  <p className="text-xs text-gray-400">{alertSubDetail(alert)}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {alerts.length > 5 ? (
        <div className="text-right mt-2">
          <button
            type="button"
            onClick={() => navigate(ROUTES.SETTINGS)}
            className="text-xs font-medium text-blue-500 hover:text-blue-600 dark:hover:text-blue-300"
          >
            View all
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default DashboardAlerts;
