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
}

const VehiclePerformanceTable = ({ vehicles }: Props) => (
  <Card title="Vehicle Performance" subtitle="Top performing vehicles this month">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Vehicle</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Trips</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Distance</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Fuel Cost</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Efficiency</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
              <td className="py-3 px-4 text-sm font-medium text-gray-900">{v.vehicle}</td>
              <td className="py-3 px-4 text-sm text-gray-600 text-right">{v.trips}</td>
              <td className="py-3 px-4 text-sm text-gray-600 text-right">{v.distance}</td>
              <td className="py-3 px-4 text-sm text-gray-600 text-right">{v.fuel}</td>
              <td className="py-3 px-4 text-sm text-gray-600 text-right">{v.efficiency}</td>
              <td className="py-3 px-4 text-sm font-semibold text-green-600 text-right">{v.revenue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

export default VehiclePerformanceTable;