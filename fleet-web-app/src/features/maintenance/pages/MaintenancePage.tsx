import { useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';

import { Button, GlobalCard } from '../../../shared/components';
import MaintenanceTable from '../components/MaintenanceTable';
import MaintenanceForm from '../components/MaintenanceForm';
import { useMaintenance } from '../hooks/useMaintenance';
import { FiPlus } from 'react-icons/fi';
import {maintenanceService} from '../services/maintenance.service';

interface ThemeContext {
  dark: boolean;
}

const MaintenancePage = () => {
  const { dark } = useOutletContext<ThemeContext>();
  const { records, isLoading } = useMaintenance();
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const handleScheduleMaintenance = useCallback((data: Record<string, unknown>) => {
    maintenanceService.create(data)
    setIsScheduleModalOpen(false);
  }, []);

  return (
    <>
      <div className={`rounded-3xl border p-6 space-y-6 ${dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100'}`}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Maintenance</h1>
            <p className={`${dark ? 'text-slate-300' : 'text-gray-600'} mt-1`}>Track vehicle maintenance and service records</p>
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
