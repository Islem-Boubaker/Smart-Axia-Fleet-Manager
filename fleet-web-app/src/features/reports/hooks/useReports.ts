import { useCallback, useEffect, useMemo, useState } from 'react';
import { driversService } from '../../drivers/services/drivers.service';
import { maintenanceService } from '../../maintenance/services/maintenance.service';
import { tripsService } from '../../trips/services/trips.service';
import { vehiclesService } from '../../vehicles/services/vehicles.service';
import type { Driver, Maintenance, Trip, Vehicle } from '../../../types';

type TrendDirection = 'up' | 'down';

type OverviewStat = {
  title: string;
  value: string;
  change: string;
  trend: TrendDirection;
  icon: string;
  color: string;
};

type VehiclePerformanceRow = {
  vehicle: string;
  trips: number;
  distance: string;
  fuel: string;
  efficiency: string;
  revenue: string;
};

type FuelAnalysisRow = {
  type: string;
  vehicles: number;
  consumption: string;
  fuel: string;
  percentage: number;
};

type MaintenanceSummaryRow = {
  category: string;
  count: number;
  cost: string;
  avgCost: string;
};

type MonthlyTrendRow = {
  month: string;
  trips: number;
  revenue: number;
  distance: number;
};

type DriverInsightSummary = {
  totalDrivers: number;
  activeDrivers: number;
  driversWithTrips: number;
  averageTripDurationMinutes: number;
};

type DriverPerformanceRow = {
  driver: string;
  trips: number;
  distance: string;
  revenue: string;
  averageDuration: string;
};

const toDate = (value?: string): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const parseNumberish = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatNumber = (value: number): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.max(0, value));

const formatCurrency = (value: number): string => `${formatNumber(value)} TND`;

const formatDuration = (minutes: number): string => {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
};

const rangeDaysMap: Record<string, number> = {
  week: 7,
  month: 30,
  quarter: 90,
  halfyear: 180,
  year: 365,
};

const inDateRange = (
  date: Date | null,
  dateRange: string,
  customRange?: { startDate?: string; endDate?: string }
): boolean => {
  if (!date) return false;

  if (dateRange === 'custom') {
    const start = customRange?.startDate ? new Date(customRange.startDate) : null;
    const end = customRange?.endDate ? new Date(customRange.endDate) : null;

    if (start && !Number.isNaN(start.getTime())) {
      start.setHours(0, 0, 0, 0);
      if (date < start) return false;
    }

    if (end && !Number.isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      if (date > end) return false;
    }

    return true;
  }

  const days = rangeDaysMap[dateRange] ?? 30;
  const threshold = new Date();
  threshold.setHours(0, 0, 0, 0);
  threshold.setDate(threshold.getDate() - days);
  return date >= threshold;
};

const trendLabel = (dateRange: string) => {
  if (dateRange === 'week') return 'Last 7 days';
  if (dateRange === 'quarter') return 'Last 3 months';
  if (dateRange === 'halfyear') return 'Last 6 months';
  if (dateRange === 'year') return 'Last 12 months';
  if (dateRange === 'custom') return 'Custom range';
  return 'Last 30 days';
};

export const useReports = (
  _reportType: string,
  dateRange: string,
  customRange?: { startDate?: string; endDate?: string }
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);

  const fetchReportData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [driversData, vehiclesData, tripsData, maintenanceData] = await Promise.all([
        driversService.getDrivers(),
        vehiclesService.getVehicles(),
        tripsService.getTrips({ page: 1, limit: 1000 }),
        maintenanceService.getAll({ page: 1, limit: 1000 }),
      ]);

      setDrivers(driversData ?? []);
      setVehicles(vehiclesData ?? []);
      setTrips(tripsData.items ?? []);
      setMaintenances(maintenanceData.items ?? []);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to load reports data.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => inDateRange(toDate(trip.startTime), dateRange, customRange));
  }, [trips, dateRange, customRange]);

  const filteredMaintenances = useMemo(() => {
    return maintenances.filter((item) => inDateRange(toDate(item.scheduledDate), dateRange, customRange));
  }, [maintenances, dateRange, customRange]);

  const effectiveRangeDays = useMemo(() => {
    if (dateRange !== 'custom') return rangeDaysMap[dateRange] ?? 30;

    const start = customRange?.startDate ? new Date(customRange.startDate) : null;
    const end = customRange?.endDate ? new Date(customRange.endDate) : null;

    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 30;

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const ms = end.getTime() - start.getTime();
    if (ms < 0) return 1;
    return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  }, [dateRange, customRange]);

  const overviewStats = useMemo<OverviewStat[]>(() => {
    const activeVehicles = vehicles.filter((v) => v.Active).length;
    const totalDistance = filteredTrips.reduce((sum, trip) => sum + parseNumberish(trip.distance), 0);
    const totalRevenue = filteredTrips.reduce((sum, trip) => sum + parseNumberish(trip.revenue), 0);

    return [
      {
        title: 'Total Vehicles',
        value: String(vehicles.length),
        change: trendLabel(dateRange),
        trend: 'up',
        icon: 'FiTruck',
        color: 'blue',
      },
      {
        title: 'Active Vehicles',
        value: String(activeVehicles),
        change: `${activeVehicles}/${vehicles.length || 1} active`,
        trend: 'up',
        icon: 'FiCheckCircle',
        color: 'green',
      },
      {
        title: 'Total Distance',
        value: `${formatNumber(totalDistance)} km`,
        change: trendLabel(dateRange),
        trend: 'up',
        icon: 'FiNavigation',
        color: 'purple',
      },
      {
        title: 'Total Revenue',
        value: formatCurrency(totalRevenue),
        change: trendLabel(dateRange),
        trend: 'down',
        icon: 'FiDollarSign',
        color: 'orange',
      },
    ];
  }, [vehicles, filteredTrips, dateRange]);

  const vehiclePerformance = useMemo<VehiclePerformanceRow[]>(() => {
    const map = new Map<string, {
      vehicle: string;
      trips: number;
      distance: number;
      fuel: number;
      revenue: number;
    }>();

    filteredTrips.forEach((trip) => {
      const key = trip.vehicleId;
      const label = trip.vehicle?.name || vehicles.find((v) => v.id === key)?.name || 'Unknown vehicle';
      const current = map.get(key) || { vehicle: label, trips: 0, distance: 0, fuel: 0, revenue: 0 };
      current.trips += 1;
      current.distance += parseNumberish(trip.distance);
      current.fuel += parseNumberish(trip.fuel);
      current.revenue += parseNumberish(trip.revenue);
      map.set(key, current);
    });

    return Array.from(map.values())
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 8)
      .map((item) => {
        const efficiency = item.distance > 0 ? (item.fuel / item.distance) * 100 : 0;
        return {
          vehicle: item.vehicle,
          trips: item.trips,
          distance: `${formatNumber(item.distance)} km`,
          fuel: `${formatNumber(item.fuel)} L`,
          efficiency: item.distance > 0 ? `${efficiency.toFixed(1)} L/100km` : 'N/A',
          revenue: formatCurrency(item.revenue),
        };
      });
  }, [filteredTrips, vehicles]);

  const fuelAnalysis = useMemo<FuelAnalysisRow[]>(() => {
    const byType = new Map<string, { vehicles: Set<string>; consumption: number; fuel: number }>();

    filteredTrips.forEach((trip) => {
      const vehicle = vehicles.find((v) => v.id === trip.vehicleId);
      const type = vehicle?.type ? vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1) : 'Other';
      const current = byType.get(type) || { vehicles: new Set<string>(), consumption: 0, fuel: 0 };
      current.vehicles.add(trip.vehicleId);
      current.consumption += parseNumberish(trip.fuel);
      current.fuel += parseNumberish(trip.fuel);
      byType.set(type, current);
    });

    const totalFuel = Array.from(byType.values()).reduce((sum, item) => sum + item.fuel, 0);

    return Array.from(byType.entries())
      .map(([type, data]) => ({
        type,
        vehicles: data.vehicles.size,
        consumption: `${formatNumber(data.consumption)} L`,
        fuel: `${formatNumber(data.fuel)} L`,
        percentage: totalFuel > 0 ? Math.round((data.fuel / totalFuel) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [filteredTrips, vehicles]);

  const maintenanceSummary = useMemo<MaintenanceSummaryRow[]>(() => {
    const byType = new Map<string, { count: number; cost: number }>();

    filteredMaintenances.forEach((item) => {
      const category = (item.type || 'Uncategorized').trim() || 'Uncategorized';
      const current = byType.get(category) || { count: 0, cost: 0 };
      current.count += 1;
      current.cost += parseNumberish(item.cost);
      byType.set(category, current);
    });

    return Array.from(byType.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        cost: formatCurrency(data.cost),
        avgCost: formatCurrency(data.count > 0 ? data.cost / data.count : 0),
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredMaintenances]);

  const monthlyTrends = useMemo<MonthlyTrendRow[]>(() => {
    const customMonthsToShow = (() => {
      const start = customRange?.startDate ? new Date(customRange.startDate) : null;
      const end = customRange?.endDate ? new Date(customRange.endDate) : null;
      if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
      const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()) +
        1;
      return Math.max(1, Math.min(24, months));
    })();

    const rangeMonthsMap: Record<string, number> = {
      week: 1,
      month: 1,
      quarter: 3,
      halfyear: 6,
      year: 12,
      custom: customMonthsToShow,
    };

    const monthsToShow = rangeMonthsMap[dateRange] ?? 6;
    const now = new Date();
    const months: { key: string; label: string; trips: number; distance: number; revenue: number }[] = [];

    for (let i = monthsToShow - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      months.push({ key, label, trips: 0, distance: 0, revenue: 0 });
    }

    filteredTrips.forEach((trip) => {
      const d = toDate(trip.startTime);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = months.find((month) => month.key === key);
      if (!bucket) return;
      bucket.trips += 1;
      bucket.distance += parseNumberish(trip.distance);
      bucket.revenue += parseNumberish(trip.revenue);
    });

    return months.map((month) => ({
      month: month.label,
      trips: month.trips,
      distance: Math.round(month.distance),
      revenue: Math.round(month.revenue),
    }));
  }, [filteredTrips, dateRange, customRange]);

  const driverInsights = useMemo<DriverInsightSummary>(() => {
    const activeDrivers = drivers.filter((d) => String(d.status || '').toLowerCase() === 'active').length;
    const driversWithTrips = new Set(
      filteredTrips
        .map((trip) => trip.userId || trip.driver?.id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    ).size;

    const completedDurations = filteredTrips
      .map((trip) => {
        const start = toDate(trip.startTime);
        const end = toDate(trip.endTime);
        if (!start || !end) return null;
        const diff = (end.getTime() - start.getTime()) / 60000;
        return diff > 0 ? diff : null;
      })
      .filter((value): value is number => typeof value === 'number');

    const averageTripDurationMinutes =
      completedDurations.length > 0
        ? completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length
        : 0;

    return {
      totalDrivers: drivers.length,
      activeDrivers,
      driversWithTrips,
      averageTripDurationMinutes,
    };
  }, [drivers, filteredTrips]);

  const driverPerformance = useMemo<DriverPerformanceRow[]>(() => {
    const byDriver = new Map<string, {
      driver: string;
      trips: number;
      distance: number;
      revenue: number;
      durationMinutesTotal: number;
      durationCount: number;
    }>();

    filteredTrips.forEach((trip) => {
      const key = trip.userId || trip.driver?.id;
      if (!key) return;

      const fallbackName = drivers.find((d) => d.id === key)?.name;
      const label = trip.driver?.name || fallbackName || 'Unknown driver';
      const current = byDriver.get(key) || {
        driver: label,
        trips: 0,
        distance: 0,
        revenue: 0,
        durationMinutesTotal: 0,
        durationCount: 0,
      };

      current.trips += 1;
      current.distance += parseNumberish(trip.distance);
      current.revenue += parseNumberish(trip.revenue);

      const start = toDate(trip.startTime);
      const end = toDate(trip.endTime);
      if (start && end) {
        const diff = (end.getTime() - start.getTime()) / 60000;
        if (diff > 0) {
          current.durationMinutesTotal += diff;
          current.durationCount += 1;
        }
      }

      byDriver.set(key, current);
    });

    return Array.from(byDriver.values())
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 8)
      .map((item) => ({
        driver: item.driver,
        trips: item.trips,
        distance: `${formatNumber(item.distance)} km`,
        revenue: formatCurrency(item.revenue),
        averageDuration: item.durationCount > 0
          ? formatDuration(item.durationMinutesTotal / item.durationCount)
          : 'N/A',
      }));
  }, [filteredTrips, drivers]);

  const exportReport = async () => {
    // Export endpoint does not exist in backend yet. Keep this as a no-op for now.
    return;
  };

  return {
    isLoading,
    error,
    exportReport,
    refetch: fetchReportData,
    rangeDays: effectiveRangeDays,
    vehiclesRaw: vehicles,
    driversRaw: drivers,
    filteredTripsRaw: filteredTrips,
    filteredMaintenancesRaw: filteredMaintenances,
    overviewStats,
    vehiclePerformance,
    fuelAnalysis,
    maintenanceSummary,
    monthlyTrends,
    driverInsights,
    driverPerformance,
  };
};
