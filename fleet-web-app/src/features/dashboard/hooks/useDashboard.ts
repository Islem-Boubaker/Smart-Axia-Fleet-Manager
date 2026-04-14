import { useCallback, useEffect, useMemo, useState } from 'react';
import { driversService } from '../../drivers/services/drivers.service';
import { maintenanceService } from '../../maintenance/services/maintenance.service';
import { tripsService } from '../../trips/services/trips.service';
import { vehiclesService } from '../../vehicles/services/vehicles.service';
import type { Driver, Maintenance, Trip, Vehicle } from '../../../types';
import { formatWeekRange, startOfWeekMonday } from '../services/dashboardUiData';

type CardTripStatus = 'completed' | 'active' | 'pending' | 'cancelled';

export interface DashboardRecentTrip {
  id: string;
  vehicle: string;
  route: string;
  meta: string;
  status: CardTripStatus;
}

export interface DashboardTask {
  vehicle: string;
  plate: string;
  timeLeft: string;
}

export interface DashboardWeekDay {
  date: Date;
  dayLabel: string;
  dayNumber: number;
  isToday: boolean;
  tripsCount: number;
}

const numberFrom = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const shortDuration = (minutes: number) => {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
};

const toDate = (value?: string): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const toCardStatus = (status: Trip['status']): CardTripStatus => {
  if (status === 'completed') return 'completed';
  if (status === 'ongoing') return 'active';
  if (status === 'cancelled') return 'cancelled';
  return 'pending';
};

export const useDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [vehiclesData, driversData, tripsData, maintData] = await Promise.all([
        vehiclesService.getVehicles(),
        driversService.getDrivers(),
        tripsService.getTrips({ page: 1, limit: 1000 }),
        maintenanceService.getAll({ page: 1, limit: 1000 }),
      ]);

      setVehicles(vehiclesData ?? []);
      setDrivers(driversData ?? []);
      setTrips(tripsData.items ?? []);
      setMaintenances(maintData.items ?? []);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to fetch dashboard data.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const totalDistanceKm = useMemo(
    () => trips.reduce((sum, trip) => sum + numberFrom(trip.distance), 0),
    [trips]
  );

  const activeVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.Active).length,
    [vehicles]
  );

  const activeDrivers = useMemo(
    () => drivers.filter((driver) => String(driver.status).toLowerCase() === 'active').length,
    [drivers]
  );

  const ongoingTripsCount = useMemo(
    () => trips.filter((trip) => trip.status === 'ongoing').length,
    [trips]
  );

  const openMaintenanceCount = useMemo(
    () => maintenances.filter((m) => ['scheduled', 'pending', 'in_progress'].includes(m.status)).length,
    [maintenances]
  );

  const completionRate = useMemo(() => {
    if (trips.length === 0) return 0;
    const completed = trips.filter((trip) => trip.status === 'completed').length;
    return Math.round((completed / trips.length) * 100);
  }, [trips]);

  const currentTask = useMemo<DashboardTask>(() => {
    const ongoing = [...trips]
      .filter((trip) => trip.status === 'ongoing')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];

    if (!ongoing) {
      return {
        vehicle: 'No ongoing trip',
        plate: '—',
        timeLeft: 'No active task right now',
      };
    }

    const vehicleName = ongoing.vehicle?.name || 'Assigned vehicle';
    const vehiclePlate = ongoing.vehicle?.plaque_immatriculation || 'No plate';
    const end = toDate(ongoing.endTime);
    const now = new Date();

    let timeLeft = 'In progress';
    if (end && end.getTime() > now.getTime()) {
      const diff = (end.getTime() - now.getTime()) / 60000;
      timeLeft = `${shortDuration(diff)} remaining`;
    }

    return {
      vehicle: vehicleName,
      plate: vehiclePlate,
      timeLeft,
    };
  }, [trips]);

  const upcomingTask = useMemo<DashboardTask>(() => {
    const now = new Date();
    const upcoming = [...trips]
      .filter((trip) => trip.status === 'scheduled')
      .filter((trip) => {
        const start = toDate(trip.startTime);
        return start ? start.getTime() >= now.getTime() : false;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

    if (!upcoming) {
      return {
        vehicle: 'No scheduled trip',
        plate: '—',
        timeLeft: 'No upcoming task',
      };
    }

    const start = toDate(upcoming.startTime);
    const timeText = start
      ? `Starts ${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
      : 'Starts soon';

    return {
      vehicle: upcoming.vehicle?.name || 'Assigned vehicle',
      plate: upcoming.vehicle?.plaque_immatriculation || 'No plate',
      timeLeft: timeText,
    };
  }, [trips]);

  const recentTrips = useMemo<DashboardRecentTrip[]>(() => {
    return [...trips]
      .sort((a, b) => new Date(b.updatedAt || b.startTime).getTime() - new Date(a.updatedAt || a.startTime).getTime())
      .slice(0, 4)
      .map((trip) => ({
        id: trip.id,
        vehicle: trip.vehicle?.name || 'Assigned vehicle',
        route: `${trip.startLocation} → ${trip.endLocation}`,
        meta: `TR-${trip.id.slice(0, 6).toUpperCase()} · ${Math.round(numberFrom(trip.distance))} km`,
        status: toCardStatus(trip.status),
      }));
  }, [trips]);

  const topDrivers = useMemo(() => {
    const byDriver = new Map<string, { name: string; trips: number }>();

    trips.forEach((trip) => {
      const key = trip.userId || trip.driver?.id;
      if (!key) return;
      const fallbackName = drivers.find((driver) => driver.id === key)?.name || 'Unknown driver';
      const current = byDriver.get(key) || { name: trip.driver?.name || fallbackName, trips: 0 };
      current.trips += 1;
      byDriver.set(key, current);
    });

    return Array.from(byDriver.values())
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 3);
  }, [trips, drivers]);

  const weekRange = useMemo(() => formatWeekRange(new Date()), []);

  const weeklyTrips = useMemo<DashboardWeekDay[]>(() => {
    const monday = startOfWeekMonday(new Date());
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return labels.map((label, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);

      const tripsCount = trips.filter((trip) => {
        const start = toDate(trip.startTime);
        return start ? isSameDay(start, date) : false;
      }).length;

      return {
        date,
        dayLabel: label,
        dayNumber: date.getDate(),
        isToday: isSameDay(date, new Date()),
        tripsCount,
      };
    });
  }, [trips]);

  return {
    isLoading,
    error,
    refetch: fetchDashboardData,
    totalVehicles: vehicles.length,
    activeVehicles,
    activeDrivers,
    ongoingTripsCount,
    totalDistanceKm,
    completionRate,
    openMaintenanceCount,
    currentTask,
    upcomingTask,
    recentTrips,
    topDrivers,
    weekRange,
    weeklyTrips,
  };
};
