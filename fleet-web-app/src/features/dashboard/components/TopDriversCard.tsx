import { Badge } from '../../../shared/components';
import type { DashboardTopDriver } from '../hooks/useDashboard';

interface TopDriversCardProps {
  drivers: DashboardTopDriver[];
}

const TopDriversCard = ({ drivers }: TopDriversCardProps) => (
  <div className="bg-white/90 dark:bg-gray-900/70 rounded-2xl border border-gray-200/70 dark:border-gray-700/60 shadow-sm p-5">
    <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Top drivers — this month</h2>

    {drivers.length === 0 ? (
      <p className="text-sm text-gray-500 dark:text-gray-400">No driver data for this month.</p>
    ) : (
      <ul>
        {drivers.map((entry, index) => (
          <li
            key={entry.driver.id}
            className="flex items-center justify-between py-2.5 px-2 rounded-lg border border-transparent hover:border-gray-200/80 dark:hover:border-gray-700/80 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs font-bold">
                {index + 1}
              </span>
              <div>
                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{entry.driver.name}</p>
                <p className="text-xs text-gray-400">
                  {Math.round(entry.km).toLocaleString('en-TN')} km · {entry.onTimeRate.toLocaleString('en-TN')}% on-time
                </p>
              </div>
            </div>
            {index === 0 ? <Badge variant="success">Top</Badge> : null}
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default TopDriversCard;
