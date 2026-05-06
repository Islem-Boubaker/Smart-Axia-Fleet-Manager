import { Card } from '../../../shared/components';
import { useTranslation } from 'react-i18next';

interface Vehicle {
  vehicle: string;
  trips: number;
  distance: string;
  fuel: string;
  efficiency: string;
  revenue: string;
}

interface Props {
  vehicles: Vehicle[];
  dark?: boolean;
}

const VehiclePerformanceTable = ({ vehicles, dark = false }: Props) => {
  const { t } = useTranslation();
  const th = dark ? 'text-slate-400' : 'text-gray-600';
  const tr = dark ? 'border-slate-700 hover:bg-slate-800/50' : 'border-gray-100 hover:bg-gray-50/80';
  const td = dark ? 'text-slate-300' : 'text-gray-600';
  const tdStrong = dark ? 'text-white' : 'text-gray-900';
  const rev = dark ? 'text-emerald-400' : 'text-green-600';
  const headBorder = dark ? 'border-slate-700' : 'border-gray-200';

  return (
    <Card
      title={t('reports.vehicle_performance.title')}
      subtitle={t('reports.vehicle_performance.subtitle')}
      padding="lg"
      dark={dark}
    >
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className={`border-b ${headBorder}`}>
              <th className={`text-left py-4 px-5 text-sm font-semibold ${th} first:rounded-tl-lg`}>{t('reports.vehicle_performance.table.vehicle')}</th>
              <th className={`text-right py-4 px-5 text-sm font-semibold ${th}`}>{t('reports.vehicle_performance.table.trips')}</th>
              <th className={`text-right py-4 px-5 text-sm font-semibold ${th}`}>{t('reports.vehicle_performance.table.distance')}</th>
              <th className={`text-right py-4 px-5 text-sm font-semibold ${th}`}>{t('reports.vehicle_performance.table.fuel_used')}</th>
              <th className={`text-right py-4 px-5 text-sm font-semibold ${th}`}>{t('reports.vehicle_performance.table.efficiency')}</th>
              <th className={`text-right py-4 px-5 text-sm font-semibold ${th} last:rounded-tr-lg`}>{t('reports.vehicle_performance.table.revenue')}</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v, i) => (
              <tr key={i} className={`border-b ${tr} last:border-0 transition-colors`}>
                <td className={`py-4 px-5 text-sm font-medium ${tdStrong}`}>{v.vehicle}</td>
                <td className={`py-4 px-5 text-sm text-right tabular-nums ${td}`}>{v.trips}</td>
                <td className={`py-4 px-5 text-sm text-right ${td}`}>{v.distance}</td>
                <td className={`py-4 px-5 text-sm text-right ${td}`}>{v.fuel}</td>
                <td className={`py-4 px-5 text-sm text-right ${td}`}>{v.efficiency}</td>
                <td className={`py-4 px-5 text-sm font-semibold text-right ${rev}`}>{v.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default VehiclePerformanceTable;
