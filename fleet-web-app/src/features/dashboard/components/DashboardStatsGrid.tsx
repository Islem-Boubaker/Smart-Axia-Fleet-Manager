import type { IconType } from 'react-icons';
import DashboardCard from './DashboardCard';

export interface StatType {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: IconType;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

interface Props {
  stats: StatType[];
}

const DashboardStatsGrid = ({ stats }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {stats.map((stat) => (
      <DashboardCard key={stat.title} {...stat} />
    ))}
  </div>
);

export default DashboardStatsGrid;
