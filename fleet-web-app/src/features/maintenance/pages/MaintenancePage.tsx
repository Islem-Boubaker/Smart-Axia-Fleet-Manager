import { useState, useCallback } from 'react';

import { Button, GlobalCard } from '../../../shared/components';
import MaintenanceTable from '../components/MaintenanceTable';
import MaintenanceForm from '../components/MaintenanceForm';
import { useMaintenance } from '../hooks/useMaintenance';
import { FiPlus } from 'react-icons/fi';

const MaintenancePage = () => {
  const { records, isLoading } = useMaintenance();
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const handleScheduleMaintenance = useCallback((data: any) => {
    console.log('Schedule maintenance:', data);
    // TODO: Implement schedule maintenance API call
    setIsScheduleModalOpen(false);
  }, []);

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Maintenance</h1>
            <p className="text-gray-600 mt-1">Track vehicle maintenance and service records</p>
          </div>
          <Button onClick={() => setIsScheduleModalOpen(true)}>
            <FiPlus className="mr-2" />
            Schedule Maintenance
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <MaintenanceTable data={records} />
        )}
      </div>

      {/* Schedule Maintenance Modal */}
      <GlobalCard
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Maintenance"
        maxWidth="2xl"
      >
        <MaintenanceForm
          onSubmit={handleScheduleMaintenance}
          onCancel={() => setIsScheduleModalOpen(false)}
        />
      </GlobalCard>
    </>
  );
};

export default MaintenancePage;
