import { Card } from '../../../shared/components';

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
  const th = dark ? 'text-slate-400' : 'text-gray-600';
  const tr = dark ? 'border-slate-700 hover:bg-slate-800/50' : 'border-gray-100 hover:bg-gray-50/80';
  const td = dark ? 'text-slate-300' : 'text-gray-600';
  const tdStrong = dark ? 'text-white' : 'text-gray-900';
  const rev = dark ? 'text-emerald-400' : 'text-green-600';
  const headBorder = dark ? 'border-slate-700' : 'border-gray-200';

  return (
    <Card
      title="Vehicle Performance"
      subtitle="Top performing vehicles this month"
      padding="lg"
      dark={dark}
      className={dark ? 'border-slate-700/80 shadow-none' : 'border-slate-200/90 shadow-glass'}
    >
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className={`border-b ${headBorder}`}>
              <th className={`text-left py-4 px-5 text-sm font-semibold ${th} first:rounded-tl-lg`}>Vehicle</th>
              <th className={`text-right py-4 px-5 text-sm font-semibold ${th}`}>Trips</th>
              <th className={`text-right py-4 px-5 text-sm font-semibold ${th}`}>Distance</th>
              <th className={`text-right py-4 px-5 text-sm font-semibold ${th}`}>Fuel Cost</th>
              <th className={`text-right py-4 px-5 text-sm font-semibold ${th}`}>Efficiency</th>
              <th className={`text-right py-4 px-5 text-sm font-semibold ${th} last:rounded-tr-lg`}>Revenue</th>
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
