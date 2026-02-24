import { Card } from '../../../shared/components';

interface Fuel {
  type: string;
  vehicles: number;
  consumption: string;
  cost: string;
  percentage: number;
}

interface Props {
  fuelData: Fuel[];
}

const FuelAnalysis = ({ fuelData }: Props) => (
  <Card title="Fuel Analysis" subtitle="Breakdown by fuel type">
    <div className="space-y-4">
      {fuelData.map(fuel => (
        <div key={fuel.type}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{fuel.type}</span>
              <span className="text-sm text-gray-500">({fuel.vehicles} vehicles)</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{fuel.cost}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${fuel.percentage}%` }}></div>
            </div>
            <span className="text-sm text-gray-600 w-12">{fuel.percentage}%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Consumption: {fuel.consumption}</p>
        </div>
      ))}
    </div>
  </Card>
);

export default FuelAnalysis;