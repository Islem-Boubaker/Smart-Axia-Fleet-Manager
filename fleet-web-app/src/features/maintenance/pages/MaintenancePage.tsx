import { useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';

import { GlobalCard } from '../../../shared/components';
import MaintenanceTable from '../components/MaintenanceTable';
import MaintenanceForm from '../components/MaintenanceForm';
import { ScheduledMaintenance } from '../components/ScheduledMaintenance';
import { MaintenanceHeader } from '../components/MaintenanceHeader';
import { useMaintenance } from '../hooks/useMaintenance';
import { maintenanceService } from '../services/maintenance.service';
import { pageShellClasses, pageShellInnerSpacing } from '../../../shared/utils/pageShell';

interface ThemeContext {
  dark: boolean;
}

const MaintenancePage = () => {
  const { dark } = useOutletContext<ThemeContext>();
  const { records, isLoading } = useMaintenance();
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const handleScheduleMaintenance = useCallback((data: Record<string, unknown>) => {
    maintenanceService.create(data);
    setIsScheduleModalOpen(false);
  }, []);

  return (
    <>
      <div className={`${pageShellClasses(dark)} ${pageShellInnerSpacing} animate-fade-in`}>
        <MaintenanceHeader onSchedule={() => setIsScheduleModalOpen(true)} dark={dark} />

        <ScheduledMaintenance dark={dark} />

        <div className="space-y-3">
          <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>All records</h2>
          <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            History and in-progress maintenance
          </p>
        </div>

        {isLoading ? (
          <div className={`text-center py-16 rounded-2xl border ${dark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
            Loading…
          </div>
        ) : (
          <MaintenanceTable data={records} dark={dark} />
        )}
      </div>

      <GlobalCard
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule maintenance"
        maxWidth="2xl"
      >
        <MaintenanceForm onSubmit={handleScheduleMaintenance} onCancel={() => setIsScheduleModalOpen(false)} />
      </GlobalCard>
    </>
  );
};

export default MaintenancePage;
