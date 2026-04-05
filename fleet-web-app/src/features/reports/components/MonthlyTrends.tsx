import { Card } from '../../../shared/components';

interface Trend {
  month: string;
  trips: number;
  revenue: number;
  distance: number;
}

interface Props {
  trends: Trend[];
  dark?: boolean;
}

const MonthlyTrends = ({ trends, dark = false }: Props) => {
  const label = dark ? 'text-slate-500' : 'text-gray-500';
  const val = dark ? 'text-white' : 'text-gray-900';
  const row = dark
    ? 'bg-slate-900/50 border-slate-700/80'
    : 'bg-gray-50/90 border-gray-100/80';
  const rev = dark ? 'text-emerald-400' : 'text-green-600';

  return (
    <Card
      title="Monthly Trends"
      subtitle="Performance over time"
      padding="lg"
      dark={dark}
      className={dark ? 'border-slate-700/80 shadow-none' : 'border-slate-200/90 shadow-glass'}
    >
      <div className="space-y-5">
        {trends.map((trend) => (
          <div
            key={trend.month}
            className={`grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6 p-5 sm:p-6 rounded-xl border ${row}`}
          >
            <div className="space-y-1.5">
              <p className={`text-xs font-medium uppercase tracking-wide ${label}`}>Month</p>
              <p className={`text-lg font-semibold ${val}`}>{trend.month}</p>
            </div>
            <div className="space-y-1.5">
              <p className={`text-xs font-medium uppercase tracking-wide ${label}`}>Trips</p>
              <p className={`text-lg font-semibold tabular-nums ${val}`}>{trend.trips}</p>
            </div>
            <div className="space-y-1.5">
              <p className={`text-xs font-medium uppercase tracking-wide ${label}`}>Distance</p>
              <p className={`text-lg font-semibold ${val}`}>{trend.distance.toLocaleString()} km</p>
            </div>
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <p className={`text-xs font-medium uppercase tracking-wide ${label}`}>Revenue</p>
              <p className={`text-lg font-semibold tabular-nums ${rev}`}>{trend.revenue.toLocaleString()} TND</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default MonthlyTrends;