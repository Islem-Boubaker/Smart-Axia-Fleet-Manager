import { Card } from '../../../shared/components';

interface Fuel {
  type: string;
  vehicles: number;
  consumption: string;
  fuel: string;
  percentage: number;
}

interface Props {
  fuelData: Fuel[];
  dark?: boolean;
}

const FuelAnalysis = ({ fuelData, dark = false }: Props) => (
  <Card
    title="Fuel Analysis"
    subtitle="Breakdown by fuel type"
    padding="lg"
    dark={dark}
    className={`h-full ${dark ? 'border-slate-700/80 shadow-none' : 'border-slate-200/90 shadow-glass'}`}
  >
    <div className="space-y-7">
      {fuelData.map((fuel) => (
        <div key={fuel.type} className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{fuel.type}</span>
              <span className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-500'}`}>({fuel.vehicles} vehicles)</span>
            </div>
            <span className={`text-sm font-semibold shrink-0 ${dark ? 'text-slate-100' : 'text-gray-900'}`}>{fuel.fuel}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex-1 rounded-full h-2.5 min-w-0 ${dark ? 'bg-slate-700' : 'bg-gray-200'}`}>
              <div className="bg-brand h-2.5 rounded-full transition-all" style={{ width: `${fuel.percentage}%` }} />
            </div>
            <span className={`text-sm w-12 text-right tabular-nums ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
              {fuel.percentage}%
            </span>
          </div>
          <p className={`text-xs pt-0.5 ${dark ? 'text-slate-500' : 'text-gray-500'}`}>Consumption: {fuel.consumption}</p>
        </div>
      ))}
    </div>
  </Card>
);

export default FuelAnalysis;