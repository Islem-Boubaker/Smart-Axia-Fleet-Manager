import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import { Button, GlobalCard } from '../../../shared/components';
import { pageShellClasses, pageShellInnerSpacing } from '../../../shared/utils/pageShell';
import { ROUTES } from '../../../utils/constants';
import type { Trip } from '../../../types';
import DashboardAlerts from '../components/DashboardAlerts';
import DashboardOverview from '../components/DashboardOverview';
import DashboardStatsGrid from '../components/DashboardStatsGrid';
import FuelUsageCard from '../components/FuelUsageCard';
import QuickActionsCard from '../components/QuickActionsCard';
import RecentTripsCard from '../components/RecentTripsCard';
import ScheduledMaintenance from '../components/ScheduledMaintenance';
import TopDriversCard from '../components/TopDriversCard';
import TripDetailsView from '../../trips/components/TripDetailsView';
import {
  buildMaintenancePrefillUrlFromAlert,
  isMaintenanceDocumentAlert,
} from '../../maintenance/utils/maintenancePrefill';
import { useDashboard } from '../hooks/useDashboard';
import type { NotificationRecord } from '../../../shared/services/notification.api';

interface ThemeContext {
  dark: boolean;
}

const DashboardPage = () => {
  const { t, i18n } = useTranslation();
  const { dark } = useOutletContext<ThemeContext>();
  const navigate = useNavigate();
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const {
    stats,
    fleetStatus,
    alerts,
    recentTrips,
    topDrivers,
    fuelByDay,
    upcomingMaintenance,
    dismissAlert,
    loading,
    error,
  } = useDashboard();

  const getReclamationId = (alert: NotificationRecord): string | null => {
    const metadata = alert.metadata as { reclamationId?: string } | undefined;
    if (metadata?.reclamationId) return String(metadata.reclamationId);
    if (alert.entityType === 'reclamation' && alert.entityId) return String(alert.entityId);
    return null;
  };

  const isDriverIssueAlert = (alert: NotificationRecord): boolean => {
    if (getReclamationId(alert)) return true;
    const text = `${alert.title} ${alert.message}`.toLowerCase();
    return text.includes('reclamation') || text.includes('vehicle issue') || text.includes('driver report');
  };

  const handleAlertClick = async (alert: NotificationRecord) => {
    await dismissAlert(alert);

    if (isMaintenanceDocumentAlert(alert)) {
      navigate(alert.actionUrl || buildMaintenancePrefillUrlFromAlert(alert));
      return;
    }

    if (alert.actionUrl?.startsWith('/')) {
      navigate(alert.actionUrl);
      return;
    }

    if (isDriverIssueAlert(alert)) {
      const reclamationId = getReclamationId(alert);
      navigate(
        reclamationId
          ? `${ROUTES.DRIVER_ISSUES}?reclamationId=${encodeURIComponent(reclamationId)}`
          : ROUTES.DRIVER_ISSUES
      );
      return;
    }

    navigate(ROUTES.SETTINGS);
  };

  const todayLabel = useMemo(() => {
    const lng = (i18n.language || 'en').split('-')[0];
    const locale = lng === 'ar' ? 'ar' : lng === 'fr' ? 'fr-FR' : 'en-GB';
    return new Date().toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [i18n.language]);

  if (loading) {
    return (
      <div className="px-6 py-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 animate-pulse">
          <div className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        </div>
        <div className="grid grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 animate-pulse">
          <div className="col-span-2 h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          <div className="col-span-1 h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        </div>
        <div className="grid grid-cols-3 gap-4 animate-pulse">
          <div className="h-72 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          <div className="h-72 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          <div className="h-72 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        </div>
        <div className="grid grid-cols-3 gap-4 animate-pulse">
          <div className="col-span-2 h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          <div className="col-span-1 h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${pageShellClasses(dark)} ${pageShellInnerSpacing} animate-fade-in`}>
      <div className="fleet-hero relative grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('dashboard.overviewLine', { date: todayLabel })}</p>
        </div>
        <div className="justify-self-start lg:justify-self-end">
          <Button onClick={() => navigate(ROUTES.TRIPS)} className="rounded-full shadow-sm">
            <FiPlus className="mr-1.5 h-4 w-4" />
            {t('dashboard.newTrip')}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200/80 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/20 px-4 py-2 text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <DashboardStatsGrid stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <DashboardOverview fleetStatus={fleetStatus} />
        </div>
        <div className="xl:col-span-1">
          <DashboardAlerts alerts={alerts} onAlertClick={handleAlertClick} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RecentTripsCard trips={recentTrips} onTripClick={setSelectedTrip} />
        <TopDriversCard drivers={topDrivers} />
        <FuelUsageCard fuelByDay={fuelByDay} activeVehicles={stats.activeVehicles} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <ScheduledMaintenance items={upcomingMaintenance} onOpenAll={() => navigate(ROUTES.MAINTENANCE)} />
        </div>
        <div className="xl:col-span-1">
          <QuickActionsCard />
        </div>
      </div>

      <GlobalCard
        isOpen={Boolean(selectedTrip)}
        onClose={() => setSelectedTrip(null)}
        title={selectedTrip ? t('dashboard.tripDetailsWithId', { id: selectedTrip.id }) : t('dashboard.tripDetails')}
        maxWidth="2xl"
      >
        {selectedTrip ? <TripDetailsView trip={selectedTrip} dark={dark} /> : null}
      </GlobalCard>
    </div>
  );
};

export default DashboardPage;
