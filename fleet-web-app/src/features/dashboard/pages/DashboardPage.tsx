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
    <div className="min-h-full space-y-10 lg:space-y-12 font-sans">
      <DashboardOverview dark={dark} />
      <PlannedTripsCalendar dark={dark} />
    </div>
  );
};

export default DashboardPage;
