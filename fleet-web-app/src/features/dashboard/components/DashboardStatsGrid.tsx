import { FiCalendar, FiDroplet, FiTool, FiTruck } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import DashboardCard from './DashboardCard';
import type { DashboardStats } from '../hooks/useDashboard';

interface DashboardStatsGridProps {
  stats: DashboardStats;
}

const DashboardStatsGrid = ({ stats }: DashboardStatsGridProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en';
  const formatTnd = (value: number) => t('dashboard.stats.tnd', { n: Math.round(value).toLocaleString(locale) });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <DashboardCard
        label={t('dashboard.stats.activeVehicles')}
        value={stats.activeVehicles.toLocaleString(locale)}
        icon={<FiTruck className="h-4 w-4" />}
        accentClassName="bg-gradient-to-r from-emerald-500 to-teal-500"
      />
      <DashboardCard
        label={t('dashboard.stats.tripsToday')}
        value={stats.tripsToday.toLocaleString(locale)}
        icon={<FiCalendar className="h-4 w-4" />}
        accentClassName="bg-gradient-to-r from-blue-500 to-cyan-500"
      />
      <DashboardCard
        label={t('dashboard.stats.maintenanceDue')}
        value={stats.maintenanceDue.toLocaleString(locale)}
        valueClassName={stats.maintenanceDue > 0 ? 'text-amber-500' : ''}
        icon={<FiTool className="h-4 w-4" />}
        accentClassName="bg-gradient-to-r from-amber-500 to-orange-500"
      />
      <DashboardCard
        label={t('dashboard.stats.fuelCostMonth')}
        value={formatTnd(stats.fuelCostMonth)}
        icon={<FiDroplet className="h-4 w-4" />}
        accentClassName="bg-gradient-to-r from-indigo-500 to-blue-600"
      />
    </div>
  );
};

export default DashboardStatsGrid;
