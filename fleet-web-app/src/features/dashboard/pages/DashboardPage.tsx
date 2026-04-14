import { useOutletContext } from 'react-router-dom';
import DashboardOverview from '../components/DashboardOverview';
import PlannedTripsCalendar from '../components/PlannedTripsCalendar';
import { useDashboard } from '../hooks/useDashboard';

interface DashboardThemeContext {
  dark: boolean;
  setDark: (dark: boolean) => void;
}

const DashboardPage = () => {
  const { dark } = useOutletContext<DashboardThemeContext>();
  const {
    isLoading,
    error,
    totalVehicles,
    activeVehicles,
    activeDrivers,
    completionRate,
    openMaintenanceCount,
    currentTask,
    upcomingTask,
    recentTrips,
    topDrivers,
    weekRange,
    weeklyTrips,
  } = useDashboard();

  return (
    <div className="min-h-full space-y-10 lg:space-y-12 font-sans">
      {error && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${dark ? 'border-red-900/50 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {error}
        </div>
      )}
      <DashboardOverview
        dark={dark}
        isLoading={isLoading}
        totalVehicles={totalVehicles}
        activeVehicles={activeVehicles}
        activeDrivers={activeDrivers}
        completionRate={completionRate}
        openMaintenanceCount={openMaintenanceCount}
        currentTask={currentTask}
        upcomingTask={upcomingTask}
        recentTrips={recentTrips}
        topDrivers={topDrivers}
      />
      <PlannedTripsCalendar dark={dark} weekRange={weekRange} weekDays={weeklyTrips} />
    </div>
  );
};

export default DashboardPage;
