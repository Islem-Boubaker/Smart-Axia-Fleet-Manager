import { useOutletContext } from 'react-router-dom';
import DashboardOverview from '../components/DashboardOverview';
import PlannedTripsCalendar from '../components/PlannedTripsCalendar';

interface DashboardThemeContext {
  dark: boolean;
  setDark: (dark: boolean) => void;
}

const DashboardPage = () => {
  const { dark } = useOutletContext<DashboardThemeContext>();

  return (
    <div className="min-h-full rounded-3xl space-y-6" style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui" }}>
      <DashboardOverview dark={dark} />
      <PlannedTripsCalendar dark={dark} />
    </div>
  );
};

export default DashboardPage;
