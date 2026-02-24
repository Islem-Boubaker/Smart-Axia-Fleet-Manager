import { Card } from '../../../shared/components';

interface Trend {
  month: string;
  trips: number;
  revenue: number;
  distance: number;
}

interface Props {
  trends: Trend[];
}

const MonthlyTrends = ({ trends }: Props) => (
  <Card title="Monthly Trends" subtitle="Performance over time">
    <div className="space-y-4">
      {trends.map(trend => (
        <div key={trend.month} className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 mb-1">Month</p>
            <p className="text-lg font-semibold text-gray-900">{trend.month}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Trips</p>
            <p className="text-lg font-semibold text-gray-900">{trend.trips}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Distance</p>
            <p className="text-lg font-semibold text-gray-900">{trend.distance.toLocaleString()} km</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Revenue</p>
            <p className="text-lg font-semibold text-green-600">{trend.revenue.toLocaleString()} TND</p>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

export default MonthlyTrends;