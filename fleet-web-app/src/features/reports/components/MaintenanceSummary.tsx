import { Card } from '../../../shared/components';

interface Maintenance {
  category: string;
  count: number;
  cost: string;
  avgCost: string;
}

interface Props {
  maintenanceData: Maintenance[];
  dark?: boolean;
}

const MaintenanceSummary = ({ maintenanceData, dark = false }: Props) => (
  <Card
    title="Maintenance Summary"
    subtitle="Service breakdown"
    padding="lg"
    dark={dark}
    className={`h-full ${dark ? 'border-slate-700/80 shadow-none' : 'border-slate-200/90 shadow-glass'}`}
  >
    <div className="space-y-4">
      {maintenanceData.map((item) => (
        <div
          key={item.category}
          className={`flex items-center justify-between gap-4 p-4 sm:p-5 rounded-xl border ${
            dark ? 'bg-slate-900/50 border-slate-700/80' : 'bg-gray-50/90 border-gray-100/80'
          }`}
        >
          <div className="min-w-0 space-y-1">
            <p className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{item.category}</p>
            <p className={`text-sm leading-relaxed ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
              {item.count} services • Avg: {item.avgCost}
            </p>
          </div>
          <span className={`text-lg font-semibold shrink-0 tabular-nums ${dark ? 'text-slate-100' : 'text-gray-900'}`}>
            {item.cost}
          </span>
        </div>
      ))}
    </div>
  </Card>
);

export default MaintenanceSummary;