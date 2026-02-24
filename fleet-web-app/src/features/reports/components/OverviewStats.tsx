import { FiTruck, FiCheckCircle, FiNavigation, FiDollarSign } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { Card } from '../../../shared/components';
import ReportCard from '../components/ReportCard';

const iconMap: Record<string, IconType> = {
  FiTruck,
  FiCheckCircle,
  FiNavigation,
  FiDollarSign,
};

export interface Stat {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
  color: string;
}

interface Props {
  stats: Stat[];
}

const OverviewStats = ({ stats }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {stats.map((stat) => (
      <Card key={stat.title} padding="md">
        <ReportCard {...stat} icon={iconMap[stat.icon] ?? FiTruck} />
      </Card>
    ))}
  </div>
);

export default OverviewStats;