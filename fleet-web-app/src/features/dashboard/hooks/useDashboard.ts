import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { driversService } from '../../drivers/services/drivers.service';
import { maintenanceService } from '../../maintenance/services/maintenance.service';
import { buildMaintenancePrefillUrl } from '../../maintenance/utils/maintenancePrefill';
import notificationApi, { type NotificationRecord } from '../../../shared/services/notification.api';
import { tripsService } from '../../trips/services/trips.service';
import { vehiclesService } from '../../vehicles/services/vehicles.service';
import { getVehicleStatusLabel, isVehicleOperational } from '../../vehicles/utils/vehicleStatus';
import type { Driver, Maintenance, Trip, Vehicle } from '../../../types';
import { FUEL_PRICE_TND } from '../../../utils/constants';
import { queryKeys } from '../../../shared/services/queryKeys';

export interface DashboardStats {
  activeVehicles: number;
  tripsToday: number;
  maintenanceDue: number;
  fuelCostMonth: number;
  tripsTodayDelta: number;
  fuelCostMonthDeltaPercent: number;
}

export interface DashboardFleetStatus {
  onTrip: number;
  available: number;
  inMaintenance: number;
  outOfService: number;
  total: number;
}

export interface DashboardTopDriver {
  driver: Driver;
  km: number;
  onTimeRate: number;
}

export interface DashboardFuelDay {
  day: string;
  liters: number;
}

interface DashboardData {
  stats: DashboardStats;
  fleetStatus: DashboardFleetStatus;
  alerts: NotificationRecord[];
  recentTrips: Trip[];
  topDrivers: DashboardTopDriver[];
  fuelByDay: DashboardFuelDay[];
  upcomingMaintenance: Maintenance[];
}

const numberFrom = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toDate = (value?: string): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const inRange = (value: Date, start: Date, end: Date) => value >= start && value <= end;

const dayRange = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const monthRange = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const classifyAlertPriority = (notification: NotificationRecord): number => {
  const text = `${notification.title} ${notification.message}`.toLowerCase();
  if (text.includes('overdue') || text.includes('past due')) return 0;
  if (text.includes('expire') || text.includes('expiring') || text.includes('soon') || text.includes('due')) return 1;
  return 2;
};

const normalizeNotifications = (payload: unknown): NotificationRecord[] => {
  if (Array.isArray(payload)) return payload as NotificationRecord[];
  if (payload && typeof payload === 'object') {
    const asRecord = payload as { data?: unknown; items?: unknown };
    if (Array.isArray(asRecord.data)) return asRecord.data as NotificationRecord[];
    if (Array.isArray(asRecord.items)) return asRecord.items as NotificationRecord[];
  }
  return [];
};

const formatDateLabel = (value?: string, locale = 'en', fallback = 'Unknown'): string => {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString(locale);
};

const daysUntilDate = (value?: string): number | null => {
  const target = toDate(value);
  if (!target) return null;

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTarget = new Date(target);
  startOfTarget.setHours(0, 0, 0, 0);

  const diffMs = startOfTarget.getTime() - startOfToday.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
};

const vehicleLabel = (vehicle: Vehicle, fallbackLabel: string): string => {
  const name = vehicle.name || fallbackLabel;
  return vehicle.plaque_immatriculation ? `${name} - ${vehicle.plaque_immatriculation}` : name;
};

const translateOr = (
  t: (key: string, options?: Record<string, unknown>) => string,
  key: string,
  fallback: string,
  options?: Record<string, unknown>
) => {
  const translated = t(key, options);
  return translated === key ? fallback : translated;
};

const buildExpiryAlerts = (
  vehicles: Vehicle[],
  locale: string,
  t: (key: string, options?: Record<string, unknown>) => string
): NotificationRecord[] => {
  const nowIso = new Date().toISOString();
  const expiryAlerts: NotificationRecord[] = [];

  vehicles.forEach((vehicle) => {
    const insuranceDays = daysUntilDate(vehicle.insurance_expiry_date || undefined);
    if (insuranceDays !== null && insuranceDays <= 7) {
      const overdue = insuranceDays < 0;
      const labeledVehicle = vehicleLabel(vehicle, t('common.vehicle'));
      const whenText = overdue
        ? translateOr(
            t,
            'dashboard.alerts.daysOverdue',
            `${Math.abs(insuranceDays)} day(s) overdue`,
            { count: Math.abs(insuranceDays) }
          )
        : translateOr(
            t,
            'dashboard.alerts.dueInDays',
            `due in ${insuranceDays} day(s)`,
            { count: insuranceDays }
          );
      const formattedDate = formatDateLabel(vehicle.insurance_expiry_date || undefined, locale, t('common.unknown'));
      const title = overdue
        ? translateOr(
            t,
            'dashboard.alerts.insuranceOverdueTitle',
            `Insurance overdue - ${labeledVehicle}`,
            { vehicle: labeledVehicle }
          )
        : translateOr(
            t,
            'dashboard.alerts.insuranceDueSoonTitle',
            `Insurance due soon - ${labeledVehicle}`,
            { vehicle: labeledVehicle }
          );
      const message = translateOr(
        t,
        'dashboard.alerts.insuranceMessage',
        `${labeledVehicle} insurance expires on ${formattedDate} (${whenText}).`,
        {
          vehicle: labeledVehicle,
          date: formattedDate,
          whenText,
        }
      );

      expiryAlerts.push({
        id: `dashboard-insurance-expiry-${vehicle.id}`,
        userId: '',
        type: 'vehicle_insurance_expiry',
        group: 'vehicle',
        priority: overdue ? 'high' : 'medium',
        title,
        message,
        entityType: 'vehicle',
        entityId: vehicle.id,
        actionUrl: buildMaintenancePrefillUrl({
          source: 'dashboard-alert',
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          vehiclePlate: vehicle.plaque_immatriculation,
          type: 'Insurance Renewal',
          priority: overdue ? 'high' : 'medium',
          description: [
            translateOr(t, 'dashboard.alerts.prefillInsurance', 'Created from insurance expiry alert.'),
            '',
            message,
            '',
            translateOr(t, 'dashboard.alerts.vehicleLine', `Vehicle: ${labeledVehicle}`, { vehicle: labeledVehicle }),
          ].join('\n'),
        }),
        metadata: {
          source: 'dashboard-computed',
          expiresAt: vehicle.insurance_expiry_date,
          daysUntilDue: insuranceDays,
          category: 'insurance',
          maintenanceType: 'Insurance Renewal',
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          vehiclePlate: vehicle.plaque_immatriculation,
        },
        read: false,
        readAt: null,
        isArchived: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }

    const techVisitDays = daysUntilDate(vehicle.tech_visit_expiry_date || undefined);
    if (techVisitDays !== null && techVisitDays <= 7) {
      const overdue = techVisitDays < 0;
      const labeledVehicle = vehicleLabel(vehicle, t('common.vehicle'));
      const whenText = overdue
        ? translateOr(
            t,
            'dashboard.alerts.daysOverdue',
            `${Math.abs(techVisitDays)} day(s) overdue`,
            { count: Math.abs(techVisitDays) }
          )
        : translateOr(
            t,
            'dashboard.alerts.dueInDays',
            `due in ${techVisitDays} day(s)`,
            { count: techVisitDays }
          );
      const formattedDate = formatDateLabel(vehicle.tech_visit_expiry_date || undefined, locale, t('common.unknown'));
      const title = overdue
        ? translateOr(
            t,
            'dashboard.alerts.techVisitOverdueTitle',
            `Tech visit overdue - ${labeledVehicle}`,
            { vehicle: labeledVehicle }
          )
        : translateOr(
            t,
            'dashboard.alerts.techVisitDueSoonTitle',
            `Tech visit due soon - ${labeledVehicle}`,
            { vehicle: labeledVehicle }
          );
      const message = translateOr(
        t,
        'dashboard.alerts.techVisitMessage',
        `${labeledVehicle} technical visit expires on ${formattedDate} (${whenText}).`,
        {
          vehicle: labeledVehicle,
          date: formattedDate,
          whenText,
        }
      );

      expiryAlerts.push({
        id: `dashboard-techvisit-expiry-${vehicle.id}`,
        userId: '',
        type: 'vehicle_tech_visit_expiry',
        group: 'vehicle',
        priority: overdue ? 'high' : 'medium',
        title,
        message,
        entityType: 'vehicle',
        entityId: vehicle.id,
        actionUrl: buildMaintenancePrefillUrl({
          source: 'dashboard-alert',
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          vehiclePlate: vehicle.plaque_immatriculation,
          type: 'Technical Visit',
          priority: overdue ? 'high' : 'medium',
          description: [
            translateOr(t, 'dashboard.alerts.prefillTechVisit', 'Created from technical visit expiry alert.'),
            '',
            message,
            '',
            translateOr(t, 'dashboard.alerts.vehicleLine', `Vehicle: ${labeledVehicle}`, { vehicle: labeledVehicle }),
          ].join('\n'),
        }),
        metadata: {
          source: 'dashboard-computed',
          expiresAt: vehicle.tech_visit_expiry_date,
          daysUntilDue: techVisitDays,
          category: 'tech-visit',
          maintenanceType: 'Technical Visit',
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          vehiclePlate: vehicle.plaque_immatriculation,
        },
        read: false,
        readAt: null,
        isArchived: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }
  });

  return expiryAlerts;
};

const isOnTimeTrip = (trip: Trip): boolean => {
  if (trip.status !== 'completed') return false;

  const orderedStops = Array.isArray(trip.stops)
    ? [...trip.stops].sort((a, b) => a.stopOrder - b.stopOrder)
    : [];

  const lastStop = orderedStops.length > 0 ? orderedStops[orderedStops.length - 1] : null;
  const scheduledArrival = toDate(lastStop?.estimatedArrival || undefined);
  const actualArrival = toDate(lastStop?.arrivalTime || trip.endTime);

  if (!scheduledArrival || !actualArrival) return false;
  return actualArrival.getTime() <= scheduledArrival.getTime();
};

const fallbackDriver = (id: string, name: string): Driver => ({
  id,
  name,
  email: 'unknown@unknown.local',
  status: 'active',
});

export const useDashboard = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [alerts, setAlerts] = useState<NotificationRecord[]>([]);

  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard.all,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const [vehiclesData, driversData, tripsData, maintenanceData, notificationsData] = await Promise.all([
        vehiclesService.getVehicles(),
        driversService.getDrivers(),
        tripsService.getTrips({ page: 1, limit: 1000, includeStops: true }),
        maintenanceService.getAll({ page: 1, limit: 1000 }),
        notificationApi.getAll({ limit: 50 }),
      ]);

      return {
        vehicles: vehiclesData ?? [],
        drivers: driversData ?? [],
        trips: tripsData.items ?? [],
        maintenances: maintenanceData.items ?? [],
        notifications: normalizeNotifications(notificationsData),
      };
    },
  });

  const vehicles = dashboardQuery.data?.vehicles ?? [];
  const drivers = dashboardQuery.data?.drivers ?? [];
  const trips = dashboardQuery.data?.trips ?? [];
  const maintenances = dashboardQuery.data?.maintenances ?? [];
  const locale = i18n.language || 'en';

  const computedAlerts = useMemo(() => {
    const expiryAlerts = buildExpiryAlerts(vehicles, locale, t);
    return (dashboardQuery.data?.notifications ?? [])
      .filter((n) => !n.read && !n.isArchived)
      .concat(expiryAlerts)
      .sort((a, b) => {
        const severity = classifyAlertPriority(a) - classifyAlertPriority(b);
        if (severity !== 0) return severity;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [dashboardQuery.data?.notifications, locale, t, vehicles]);

  const visibleAlerts = alerts.length > 0 ? alerts : computedAlerts;

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  }, [queryClient]);

  const dismissAlert = useCallback(async (alert: NotificationRecord) => {
    setAlerts((prev) => {
      const base = prev.length > 0 ? prev : computedAlerts;
      return base.filter((item) => item.id !== alert.id);
    });

    const isComputedAlert =
      String(alert.id).startsWith('dashboard-') ||
      String((alert.metadata as { source?: string } | undefined)?.source) === 'dashboard-computed';

    if (isComputedAlert) {
      return;
    }

    try {
      await notificationApi.markAsRead(alert.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    } catch {
      // Keep UI responsive even if read-sync fails.
    }
  }, [computedAlerts, queryClient]);

  const data = useMemo<DashboardData>(() => {
    const now = new Date();
    const today = dayRange(now);
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterday = dayRange(yesterdayDate);

    const currentMonth = monthRange(now);
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = monthRange(previousMonthDate);

    const tripsToday = trips.filter((trip) => {
      const start = toDate(trip.startTime);
      return start ? inRange(start, today.start, today.end) : false;
    }).length;

    const tripsYesterday = trips.filter((trip) => {
      const start = toDate(trip.startTime);
      return start ? inRange(start, yesterday.start, yesterday.end) : false;
    }).length;

    const maintenanceDue = maintenances.filter((item) => {
      if (item.status === 'completed' || item.status === 'cancelled') return false;
      const scheduled = toDate(item.scheduledDate);
      if (!scheduled) return false;
      const max = new Date(now);
      max.setDate(now.getDate() + 7);
      max.setHours(23, 59, 59, 999);
      const min = new Date(now);
      min.setHours(0, 0, 0, 0);
      return inRange(scheduled, min, max);
    }).length;

    const currentMonthFuelLiters = trips
      .filter((trip) => {
        const start = toDate(trip.startTime);
        return start ? inRange(start, currentMonth.start, currentMonth.end) : false;
      })
      .reduce((sum, trip) => sum + numberFrom((trip as unknown as { fuelConsumed?: number }).fuelConsumed ?? trip.fuel), 0);

    const previousMonthFuelLiters = trips
      .filter((trip) => {
        const start = toDate(trip.startTime);
        return start ? inRange(start, previousMonth.start, previousMonth.end) : false;
      })
      .reduce((sum, trip) => sum + numberFrom((trip as unknown as { fuelConsumed?: number }).fuelConsumed ?? trip.fuel), 0);

    const fuelCostMonth = currentMonthFuelLiters * FUEL_PRICE_TND;
    const previousFuelCostMonth = previousMonthFuelLiters * FUEL_PRICE_TND;

    // DB vehicle.status is the single source of truth for fleet buckets.
    const fleetStatusCounts = vehicles.reduce(
      (acc, vehicle) => {
        const statusLabel = getVehicleStatusLabel(vehicle);

        if (statusLabel === 'In Use') {
          acc.onTrip += 1;
        } else if (statusLabel === 'Maintenance') {
          acc.inMaintenance += 1;
        } else if (statusLabel === 'Inactive') {
          acc.outOfService += 1;
        } else {
          acc.available += 1;
        }

        return acc;
      },
      { onTrip: 0, inMaintenance: 0, outOfService: 0, available: 0 }
    );

    const { onTrip, inMaintenance, outOfService, available } = fleetStatusCounts;
    const total = vehicles.length;

    const recentTrips = [...trips]
      .sort((a, b) => new Date(b.createdAt || b.startTime).getTime() - new Date(a.createdAt || a.startTime).getTime())
      .slice(0, 5);

    const monthTrips = trips.filter((trip) => {
      const start = toDate(trip.startTime);
      return start ? inRange(start, currentMonth.start, currentMonth.end) : false;
    });

    const topDriverMap = new Map<string, { driver: Driver; km: number; onTimeCount: number; totalTrips: number }>();

    monthTrips.forEach((trip) => {
      const driverId = trip.userId || trip.driver?.id;
      if (!driverId) return;

      const fromDrivers = drivers.find((driver) => String(driver.id) === String(driverId));
      const fallbackName = trip.driver?.name || 'Unknown driver';
      const driver = fromDrivers || fallbackDriver(String(driverId), fallbackName);

      const current = topDriverMap.get(String(driverId)) || {
        driver,
        km: 0,
        onTimeCount: 0,
        totalTrips: 0,
      };

      current.km += numberFrom(trip.distance);
      current.totalTrips += 1;
      if (isOnTimeTrip(trip)) current.onTimeCount += 1;

      topDriverMap.set(String(driverId), current);
    });

    const topDrivers = Array.from(topDriverMap.values())
      .map((item) => ({
        driver: item.driver,
        km: item.km,
        onTimeRate: item.totalTrips > 0 ? Math.round((item.onTimeCount / item.totalTrips) * 100) : 0,
      }))
      .sort((a, b) => b.onTimeRate - a.onTimeRate)
      .slice(0, 4);

    const fuelByDay: DashboardFuelDay[] = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      const range = dayRange(date);

      const liters = trips
        .filter((trip) => trip.status === 'completed')
        .filter((trip) => {
          const start = toDate(trip.startTime);
          return start ? inRange(start, range.start, range.end) : false;
        })
        .reduce((sum, trip) => sum + numberFrom((trip as unknown as { fuelConsumed?: number }).fuelConsumed ?? trip.fuel), 0);

      return {
        day: date.toLocaleDateString('en-GB', { weekday: 'short' }),
        liters,
      };
    });

    const upcomingMaintenance = [...maintenances]
      .filter((item) => {
        const date = toDate(item.scheduledDate);
        if (!date) return false;
        const max = new Date(now);
        max.setDate(now.getDate() + 14);
        max.setHours(23, 59, 59, 999);
        const min = new Date(now);
        min.setHours(0, 0, 0, 0);
        return inRange(date, min, max);
      })
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
      .slice(0, 5);

    const tripsTodayDelta = tripsToday - tripsYesterday;
    const fuelCostMonthDeltaPercent =
      previousFuelCostMonth > 0 ? Math.round(((fuelCostMonth - previousFuelCostMonth) / previousFuelCostMonth) * 100) : 0;

    return {
      stats: {
        activeVehicles: vehicles.filter(isVehicleOperational).length,
        tripsToday,
        maintenanceDue,
        fuelCostMonth,
        tripsTodayDelta,
        fuelCostMonthDeltaPercent,
      },
      fleetStatus: {
        onTrip,
        available,
        inMaintenance,
        outOfService,
        total,
      },
      alerts: visibleAlerts.slice(0, 5),
      recentTrips,
      topDrivers,
      fuelByDay,
      upcomingMaintenance,
    };
  }, [drivers, maintenances, trips, vehicles, visibleAlerts]);

  const error =
    (dashboardQuery.error as { response?: { data?: { message?: string } }; message?: string } | null)?.response?.data?.message ||
    (dashboardQuery.error as Error | null)?.message ||
    null;

  return {
    ...data,
    loading: dashboardQuery.isLoading,
    error,
    refetch,
    dismissAlert,
  };
};
