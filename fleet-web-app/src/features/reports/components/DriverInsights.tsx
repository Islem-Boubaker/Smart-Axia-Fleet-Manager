import { Card } from '../../../shared/components';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const statBox = dark
    ? 'bg-slate-900/50 border-slate-700/80 text-slate-100'
    : 'bg-gray-50/90 border-gray-200 text-slate-900';

  const headBorder = dark ? 'border-slate-700' : 'border-gray-200';
  const rowBorder = dark ? 'border-slate-700 hover:bg-slate-800/50' : 'border-gray-100 hover:bg-gray-50/80';
  const td = dark ? 'text-slate-300' : 'text-gray-600';
  const tdStrong = dark ? 'text-white' : 'text-gray-900';

  return (
    <Card
      title={t('reports.driver_insights.title')}
      subtitle={t('reports.driver_insights.subtitle')}
      padding="lg"
      dark={dark}
      className={dark ? 'border-slate-700/80 shadow-none' : 'border-slate-200/90 shadow-glass'}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className={`rounded-xl border p-4 ${statBox}`}>
          <p className={`text-xs uppercase tracking-wide ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t('reports.driver_insights.total_drivers')}</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">{summary.totalDrivers}</p>
        </div>
        <div className={`rounded-xl border p-4 ${statBox}`}>
          <p className={`text-xs uppercase tracking-wide ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t('reports.driver_insights.active_drivers')}</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">{summary.activeDrivers}</p>
        </div>
        <div className={`rounded-xl border p-4 ${statBox}`}>
          <p className={`text-xs uppercase tracking-wide ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t('reports.driver_insights.drivers_with_trips')}</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">{summary.driversWithTrips}</p>
        </div>
        <div className={`rounded-xl border p-4 ${statBox}`}>
          <p className={`text-xs uppercase tracking-wide ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t('reports.driver_insights.avg_time_per_trip')}</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">
            {summary.averageTripDurationMinutes > 0
              ? t('reports.driver_insights.minutes', { n: Math.round(summary.averageTripDurationMinutes) })
              : t('common.na')}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className={`border-b ${headBorder}`}>
              <th className={`text-left py-4 px-5 text-sm font-semibold ${dark ? 'text-slate-400' : 'text-gray-600'}`}>{t('reports.driver_insights.table.driver')}</th>
              <th className={`text-right py-4 px-5 text-sm font-semibold ${dark ? 'text-slate-400' : 'text-gray-600'}`}>{t('reports.driver_insights.table.trips')}</th>
              <th className={`text-right py-4 px-5 text-sm font-semibold ${dark ? 'text-slate-400' : 'text-gray-600'}`}>{t('reports.driver_insights.table.distance')}</th>
              <th className={`text-right py-4 px-5 text-sm font-semibold ${dark ? 'text-slate-400' : 'text-gray-600'}`}>{t('reports.driver_insights.table.revenue')}</th>
              <th className={`text-right py-4 px-5 text-sm font-semibold ${dark ? 'text-slate-400' : 'text-gray-600'}`}>{t('reports.driver_insights.table.avg_duration')}</th>
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
