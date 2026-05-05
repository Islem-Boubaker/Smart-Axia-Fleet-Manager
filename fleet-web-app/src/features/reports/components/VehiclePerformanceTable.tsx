import { AppDataTable, AppTd, AppTr } from '../../../shared/components';

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
  const td = dark ? 'text-slate-300' : 'text-gray-600';
  const tdStrong = dark ? 'text-white' : 'text-gray-900';
  const rev = dark ? 'text-emerald-400' : 'text-green-600';

  return (
    <AppDataTable
      columns={['Vehicle', 'Trips', 'Distance', 'Fuel Used', 'Efficiency', 'Revenue']}
      totalResults={vehicles.length}
      dark={dark}
      ariaLabel="Vehicle performance table"
      title="Vehicle performance"
      pageSize={6}
    >
      {vehicles.map((v, i) => (
        <AppTr key={`${v.vehicle}-${i}`}>
          <AppTd className={`text-sm font-bold ${tdStrong}`}>{v.vehicle}</AppTd>
          <AppTd className={`text-sm tabular-nums ${td}`}>{v.trips}</AppTd>
          <AppTd className={`text-sm ${td}`}>{v.distance}</AppTd>
          <AppTd className={`text-sm ${td}`}>{v.fuel}</AppTd>
          <AppTd className={`text-sm ${td}`}>{v.efficiency}</AppTd>
          <AppTd className={`text-sm font-bold ${rev}`}>{v.revenue}</AppTd>
        </AppTr>
      ))}
    </AppDataTable>
  );
};

export default VehiclePerformanceTable;
