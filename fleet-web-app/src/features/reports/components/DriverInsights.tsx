import { Card } from '../../../shared/components';

interface DriverInsightsProps {
  summary: {
    totalDrivers: number;
    activeDrivers: number;
    driversWithTrips: number;
    averageTripDurationMinutes: number;
  };
  rows: {
    driver: string;
    trips: number;
    distance: string;
    revenue: string;
    averageDuration: string;
  }[];
  dark?: boolean;
}

const DriverInsights = ({ summary, rows, dark = false }: DriverInsightsProps) => {
  const statBox = dark
    ? 'bg-slate-900/50 border-slate-700/80 text-slate-100'
    : 'bg-gray-50/90 border-gray-200 text-slate-900';

  const headBorder = dark ? 'border-slate-700' : 'border-gray-200';
  const rowBorder = dark ? 'border-slate-700 hover:bg-slate-800/50' : 'border-gray-100 hover:bg-gray-50/80';
  const td = dark ? 'text-slate-300' : 'text-gray-600';
  const tdStrong = dark ? 'text-white' : 'text-gray-900';

  return (
    <Card
      title="Driver Insights"
      subtitle="Driver workload and trip duration"
      padding="lg"
      dark={dark}
      className={dark ? 'border-slate-700/80 shadow-none' : 'border-slate-200/90 shadow-glass'}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className={`rounded-xl border p-4 ${statBox}`}>
          <p className={`text-xs uppercase tracking-wide ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Total Drivers</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">{summary.totalDrivers}</p>
        </div>
        <div className={`rounded-xl border p-4 ${statBox}`}>
          <p className={`text-xs uppercase tracking-wide ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Active Drivers</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">{summary.activeDrivers}</p>
        </div>
        <div className={`rounded-xl border p-4 ${statBox}`}>
          <p className={`text-xs uppercase tracking-wide ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Drivers With Trips</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">{summary.driversWithTrips}</p>
        </div>
        <div className={`rounded-xl border p-4 ${statBox}`}>
          <p className={`text-xs uppercase tracking-wide ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Avg Time Per Trip</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">
            {summary.averageTripDurationMinutes > 0
              ? `${Math.round(summary.averageTripDurationMinutes)} min`
              : 'N/A'}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className={`border-b ${headBorder}`}>
              <th className={`text-left py-4 px-5 text-sm font-semibold ${dark ? 'text-slate-400' : 'text-gray-600'}`}>Driver</th>
              <th className={`text-right py-4 px-5 text-sm font-semibold ${dark ? 'text-slate-400' : 'text-gray-600'}`}>Trips</th>
              <th className={`text-right py-4 px-5 text-sm font-semibold ${dark ? 'text-slate-400' : 'text-gray-600'}`}>Distance</th>
              <th className={`text-right py-4 px-5 text-sm font-semibold ${dark ? 'text-slate-400' : 'text-gray-600'}`}>Revenue</th>
              <th className={`text-right py-4 px-5 text-sm font-semibold ${dark ? 'text-slate-400' : 'text-gray-600'}`}>Avg Duration</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.driver} className={`border-b ${rowBorder} last:border-0 transition-colors`}>
                <td className={`py-4 px-5 text-sm font-medium ${tdStrong}`}>{row.driver}</td>
                <td className={`py-4 px-5 text-sm text-right tabular-nums ${td}`}>{row.trips}</td>
                <td className={`py-4 px-5 text-sm text-right ${td}`}>{row.distance}</td>
                <td className={`py-4 px-5 text-sm text-right ${td}`}>{row.revenue}</td>
                <td className={`py-4 px-5 text-sm text-right ${td}`}>{row.averageDuration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default DriverInsights;
