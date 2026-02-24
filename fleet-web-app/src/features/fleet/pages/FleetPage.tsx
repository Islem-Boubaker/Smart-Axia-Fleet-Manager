import { Card } from '../../../shared/components';
import FleetTable from '../components/FleetTable';
import { useFleet } from '../hooks/useFleet';

const FleetPage = () => {
  const { fleets, isLoading } = useFleet();

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-600 mt-1">Manage your fleet operations</p>
        </div>

        <Card>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <FleetTable data={fleets} />
          )}
        </Card>
      </div>
    </>
  );
};

export default FleetPage;
