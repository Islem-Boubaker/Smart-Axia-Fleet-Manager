import DashboardStatsGrid from "../components/DashboardStatsGrid";
import RecentVehiclesCard from "../components/RecentVehiclesCard";
import RecentTripsCard from "../components/RecentTripsCard";
import QuickActionsCard from "../components/QuickActionsCard";
import { useDashboard } from "../hooks/useDashboard";

const DashboardPage = () => {
  const { stats, recentVehicles, recentTrips, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <DashboardStatsGrid stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentVehiclesCard vehicles={recentVehicles} />
          <RecentTripsCard trips={recentTrips} />
        </div>

        <QuickActionsCard />
      </div>
    </>
  );
};

export default DashboardPage;
