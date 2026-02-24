import { Card } from '../../../shared/components';

interface Maintenance {
  category: string;
  count: number;
  cost: string;
  avgCost: string;
}

interface Props {
  maintenanceData: Maintenance[];
}

const MaintenanceSummary = ({ maintenanceData }: Props) => (
  <Card title="Maintenance Summary" subtitle="Service breakdown">
    <div className="space-y-3">
      {maintenanceData.map(item => (
        <div key={item.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">{item.category}</p>
            <p className="text-sm text-gray-600">{item.count} services • Avg: {item.avgCost}</p>
          </div>
          <span className="text-lg font-semibold text-gray-900">{item.cost}</span>
        </div>
      ))}
    </div>
  </Card>
);

export default MaintenanceSummary;