import { useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FiDownload } from 'react-icons/fi';
import { Badge, Button, Card } from '../../../shared/components';
import { useReports } from '../hooks/useReports';
import { FUEL_PRICE_TND } from '../../../utils/constants';
import { pageShellClasses, pageShellInnerSpacing } from '../../../shared/utils/pageShell';
import type { Trip } from '../../../types';

interface ThemeContext {
  dark: boolean;
}

const parseNumberish = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.max(0, value));

const formatCurrency = (value: number) => `${formatNumber(value)} TND`;

const toDate = (value?: string) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const isOnTimeTrip = (trip: Trip) => {
  if (trip.status !== 'completed') return false;
  const orderedStops = Array.isArray(trip.stops)
    ? [...trip.stops].sort((a, b) => a.stopOrder - b.stopOrder)
    : [];
  const lastStop = orderedStops.length ? orderedStops[orderedStops.length - 1] : null;
  const scheduled = toDate(lastStop?.estimatedArrival || undefined);
  const actual = toDate(lastStop?.arrivalTime || trip.endTime);
  if (!scheduled || !actual) return false;
  return actual.getTime() <= scheduled.getTime();
};

const ReportsPage = () => {
  const { dark } = useOutletContext<ThemeContext>();
  const pdfRef = useRef<HTMLDivElement>(null);
  const [dateRange, setDateRange] = useState('month');
  const [customRange, setCustomRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  });

  const {
    isLoading,
    error,
    rangeDays,
    vehiclesRaw,
    driversRaw,
    filteredTripsRaw,
    filteredMaintenancesRaw,
    monthlyTrends,
  } = useReports('overview', dateRange, customRange);

  const exportPDF = async () => {
    const element = pdfRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('reports.pdf');
  };

  const sectionSubtitleClass = dark
    ? 'flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-200'
    : 'flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-800';

  const sectionIndexClass = dark
    ? 'inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-slate-600 bg-slate-800 px-2 text-[11px] font-bold text-slate-200'
    : 'inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-slate-300 bg-slate-100 px-2 text-[11px] font-bold text-slate-700';

  const analytics = useMemo(() => {
    const totalTrips = filteredTripsRaw.length;
    const totalKm = filteredTripsRaw.reduce((sum, trip) => sum + parseNumberish(trip.distance), 0);
    const completedTrips = filteredTripsRaw.filter((trip) => trip.status === 'completed');
    const cancelledTrips = filteredTripsRaw.filter((trip) => trip.status === 'cancelled').length;
    const onTimeTrips = completedTrips.filter(isOnTimeTrip).length;

    const onTimeRate = completedTrips.length > 0 ? (onTimeTrips / completedTrips.length) * 100 : 0;
    const cancellationRate = totalTrips > 0 ? (cancelledTrips / totalTrips) * 100 : 0;

    const trendValues = monthlyTrends.map((item) => item.trips);
    const current = trendValues.length > 0 ? trendValues[trendValues.length - 1] : 0;
    const previous = trendValues.length > 1 ? trendValues[trendValues.length - 2] : 0;
    const tripDelta = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    const bucketCount = 8;
    const buckets = Array.from({ length: bucketCount }).map((_, index) => ({
      label: `W${index + 1}`,
      value: 0,
    }));
    const now = Date.now();
    const windowMs = rangeDays * 24 * 60 * 60 * 1000;

    filteredTripsRaw.forEach((trip) => {
      const start = toDate(trip.startTime);
      if (!start) return;
      const age = now - start.getTime();
      if (age < 0 || age > windowMs) return;
      const ratio = age / windowMs;
      const bucketIndex = Math.min(bucketCount - 1, Math.max(0, bucketCount - 1 - Math.floor(ratio * bucketCount)));
      buckets[bucketIndex].value += 1;
    });

    return {
      totalTrips,
      totalKm,
      onTimeRate,
      cancellationRate,
      tripDelta,
      weeklyBuckets: buckets,
    };
  }, [filteredTripsRaw, monthlyTrends, rangeDays]);

  const fuelStats = useMemo(() => {
    const totalFuel = filteredTripsRaw.reduce((sum, trip) => sum + parseNumberish(trip.fuel), 0);
    const totalKm = filteredTripsRaw.reduce((sum, trip) => sum + parseNumberish(trip.distance), 0);
    const avgFuelPer100 = totalKm > 0 ? (totalFuel / totalKm) * 100 : 0;
    const totalFuelCost = totalFuel * FUEL_PRICE_TND;

    const byVehicle = new Map<string, { plate: string; fuel: number }>();
    filteredTripsRaw.forEach((trip) => {
      const key = trip.vehicleId;
      const fallbackVehicle = vehiclesRaw.find((vehicle) => vehicle.id === key);
      const vehicleName = trip.vehicle?.name || fallbackVehicle?.name || 'Unknown vehicle';
      const vehiclePlate = trip.vehicle?.plaque_immatriculation || fallbackVehicle?.plaque_immatriculation || '';
      const vehicleLabel = vehiclePlate ? `${vehicleName} (${vehiclePlate})` : vehicleName;
      const current = byVehicle.get(key) || { plate: vehicleLabel, fuel: 0 };
      current.fuel += parseNumberish(trip.fuel);
      byVehicle.set(key, current);
    });

    const topVehiclesFuel = Array.from(byVehicle.values())
      .sort((a, b) => b.fuel - a.fuel)
      .slice(0, 5);

    return {
      totalFuel,
      avgFuelPer100,
      totalFuelCost,
      topVehiclesFuel,
    };
  }, [filteredTripsRaw, vehiclesRaw]);

  const maintenanceStats = useMemo(() => {
    const completed = filteredMaintenancesRaw.filter((item) => item.status === 'completed');
    const totalCost = filteredMaintenancesRaw.reduce((sum, item) => sum + parseNumberish(item.cost), 0);

    const downtimeDays = completed
      .map((item) => {
        const scheduled = toDate(item.scheduledDate);
        const completedAt = toDate(item.completedAt);
        if (!scheduled || !completedAt) return null;
        const diff = (completedAt.getTime() - scheduled.getTime()) / (24 * 60 * 60 * 1000);
        return diff >= 0 ? diff : null;
      })
      .filter((value): value is number => typeof value === 'number');

    const avgDowntime = downtimeDays.length > 0
      ? downtimeDays.reduce((sum, value) => sum + value, 0) / downtimeDays.length
      : 0;

    const byVehicle = new Map<string, { plate: string; cost: number; jobs: number; types: Set<string> }>();
    filteredMaintenancesRaw.forEach((item) => {
      const plate = item.vehiclePlate || 'Unknown';
      const matchedVehicle = vehiclesRaw.find((vehicle) => vehicle.plaque_immatriculation === plate);
      const vehicleLabel = matchedVehicle?.name
        ? `${matchedVehicle.name} (${plate})`
        : plate;

      const current = byVehicle.get(plate) || { plate: vehicleLabel, cost: 0, jobs: 0, types: new Set<string>() };
      current.cost += parseNumberish(item.cost);
      current.jobs += 1;
      if (item.type) current.types.add(item.type);
      byVehicle.set(plate, current);
    });

    const costByVehicle = Array.from(byVehicle.values())
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    return {
      jobsCompleted: completed.length,
      totalCost,
      avgDowntime,
      costByVehicle,
    };
  }, [filteredMaintenancesRaw, vehiclesRaw]);

  const driverScorecard = useMemo(() => {
    const byDriver = new Map<string, {
      name: string;
      trips: number;
      km: number;
      completedTrips: number;
      onTimeTrips: number;
    }>();

    filteredTripsRaw.forEach((trip) => {
      const key = trip.userId || trip.driver?.id;
      if (!key) return;
      const fallbackDriver = driversRaw.find((driver) => driver.id === key);
      const name = trip.driver?.name || fallbackDriver?.name || 'Unknown driver';
      const current = byDriver.get(key) || {
        name,
        trips: 0,
        km: 0,
        completedTrips: 0,
        onTimeTrips: 0,
      };
      current.trips += 1;
      current.km += parseNumberish(trip.distance);
      if (trip.status === 'completed') {
        current.completedTrips += 1;
        if (isOnTimeTrip(trip)) current.onTimeTrips += 1;
      }
      byDriver.set(key, current);
    });

    const gradeFromRate = (rate: number) => {
      if (rate >= 96) return { label: 'A+', variant: 'success' as const };
      if (rate >= 90) return { label: 'A', variant: 'success' as const };
      if (rate >= 80) return { label: 'B', variant: 'warning' as const };
      return { label: 'C', variant: 'error' as const };
    };

    return Array.from(byDriver.values())
      .map((item) => {
        const onTimeRate = item.completedTrips > 0 ? (item.onTimeTrips / item.completedTrips) * 100 : 0;
        return {
          ...item,
          onTimeRate,
          grade: gradeFromRate(onTimeRate),
        };
      })
      .sort((a, b) => b.onTimeRate - a.onTimeRate)
      .slice(0, 6);
  }, [filteredTripsRaw, driversRaw]);

  const utilization = useMemo(() => {
    const byVehicleDays = new Map<string, Set<string>>();
    filteredTripsRaw.forEach((trip) => {
      const start = toDate(trip.startTime);
      if (!start) return;
      const dateKey = start.toISOString().slice(0, 10);
      const current = byVehicleDays.get(trip.vehicleId) || new Set<string>();
      current.add(dateKey);
      byVehicleDays.set(trip.vehicleId, current);
    });

    const rows = vehiclesRaw
      .map((vehicle) => {
        const activeDays = byVehicleDays.get(vehicle.id)?.size || 0;
        const rate = Math.min(100, (activeDays / Math.max(1, rangeDays)) * 100);
        const vehicleLabel = vehicle.plaque_immatriculation
          ? `${vehicle.name} (${vehicle.plaque_immatriculation})`
          : vehicle.name;
        return {
          vehicle: vehicleLabel,
          rate,
        };
      })
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);

    const lowest = rows.length > 0 ? rows[rows.length - 1] : null;
    return {
      rows,
      recommendation: lowest && lowest.rate < 25 ? `${lowest.vehicle} may be a candidate for reassignment.` : null,
    };
  }, [filteredTripsRaw, vehiclesRaw, rangeDays]);

  const periodButtons = [
    { label: 'This month', value: 'month' },
    { label: 'Last 3 months', value: 'quarter' },
    { label: 'Last 6 months', value: 'halfyear' },
    { label: 'This year', value: 'year' },
  ];

  const customRangeInvalid =
    Boolean(customRange.startDate) &&
    Boolean(customRange.endDate) &&
    new Date(customRange.startDate).getTime() > new Date(customRange.endDate).getTime();

  return (
    <div className={`${pageShellClasses(dark)} ${pageShellInnerSpacing}`}>
      <div className="space-y-2">
        <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>Reports</h1>
        <p className={`text-sm sm:text-base ${dark ? 'text-slate-400' : 'text-slate-600'}`}>Fleet analytics with actionable operational insights.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {periodButtons.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setDateRange(option.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              dateRange === option.value
                ? dark
                  ? 'border-slate-500 bg-slate-700/80 text-slate-100'
                  : 'border-slate-300 bg-slate-100 text-slate-900'
                : dark
                  ? 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setDateRange('custom')}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            dateRange === 'custom'
              ? dark
                ? 'border-slate-500 bg-slate-700/80 text-slate-100'
                : 'border-slate-300 bg-slate-100 text-slate-900'
              : dark
                ? 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-200'
                : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
          }`}
        >
          Custom range
        </button>
        <div className="ml-auto">
          <Button size="sm" onClick={exportPDF} className="rounded-full">
            <FiDownload className="mr-1.5" />
            Export PDF
          </Button>
        </div>
      </div>

      {dateRange === 'custom' && (
        <Card
          dark={dark}
          padding="sm"
          className={dark ? 'border-slate-700/80' : 'border-slate-200/90'}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>Start date</span>
              <input
                type="date"
                value={customRange.startDate}
                onChange={(e) => setCustomRange((prev) => ({ ...prev, startDate: e.target.value }))}
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20 ${
                  dark
                    ? 'bg-slate-800/70 border-slate-700 text-slate-100'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
            </label>
            <label className="space-y-1">
              <span className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>End date</span>
              <input
                type="date"
                value={customRange.endDate}
                onChange={(e) => setCustomRange((prev) => ({ ...prev, endDate: e.target.value }))}
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/20 ${
                  dark
                    ? 'bg-slate-800/70 border-slate-700 text-slate-100'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
            </label>
          </div>
          {customRangeInvalid && (
            <p className="mt-2 text-xs text-rose-500">Start date must be before end date.</p>
          )}
        </Card>
      )}

      {error && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${dark ? 'border-red-900/50 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {error}
        </div>
      )}

      <div ref={pdfRef} id="pdf-content" className="space-y-8 lg:space-y-10">
        {isLoading ? (
          <div className={`text-center py-16 rounded-2xl border ${dark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
            Loading reports...
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className={sectionSubtitleClass}>
                <span className={sectionIndexClass}>1</span>
                <span>Trip Analytics</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <Card dark={dark} padding="sm"><p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>Total trips</p><p className={`mt-1 text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{formatNumber(analytics.totalTrips)}</p></Card>
                <Card dark={dark} padding="sm"><p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>Total km driven</p><p className={`mt-1 text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{formatNumber(analytics.totalKm)}</p></Card>
                <Card dark={dark} padding="sm"><p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>On-time rate</p><p className={`mt-1 text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{analytics.onTimeRate.toFixed(1)}%</p></Card>
                <Card dark={dark} padding="sm"><p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>Cancellation rate</p><p className={`mt-1 text-2xl font-semibold ${dark ? 'text-amber-300' : 'text-amber-600'}`}>{analytics.cancellationRate.toFixed(1)}%</p></Card>
              </div>
              <Card dark={dark} title="Trips per week" subtitle="Volume trend across selected period" padding="sm">
                <div className="space-y-3">
                  <div className="flex items-end gap-1 h-16">
                    {analytics.weeklyBuckets.map((bucket, index) => {
                      const maxValue = Math.max(1, ...analytics.weeklyBuckets.map((item) => item.value));
                      const height = Math.max(10, Math.round((bucket.value / maxValue) * 100));
                      return (
                        <div
                          key={bucket.label}
                          title={`${bucket.value} trips`}
                          className={`flex-1 rounded-t ${index === analytics.weeklyBuckets.length - 1 ? 'bg-brand' : dark ? 'bg-brand/45' : 'bg-brand/35'}`}
                          style={{ height: `${height}%` }}
                        />
                      );
                    })}
                  </div>
                  <div className={`flex justify-between text-[11px] ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                    {analytics.weeklyBuckets.map((bucket) => (
                      <span key={bucket.label}>{bucket.label}</span>
                    ))}
                  </div>
                </div>
              </Card>
            </section>

            <section className="space-y-3">
              <h2 className={sectionSubtitleClass}>
                <span className={sectionIndexClass}>2</span>
                <span>Fuel and Cost Analysis</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                <Card dark={dark} padding="sm"><p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>Total fuel consumed</p><p className={`mt-1 text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{formatNumber(fuelStats.totalFuel)} L</p></Card>
                <Card dark={dark} padding="sm"><p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>Avg fuel per 100km</p><p className={`mt-1 text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{fuelStats.avgFuelPer100.toFixed(1)} L</p></Card>
                <Card dark={dark} padding="sm"><p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>Total fuel cost</p><p className={`mt-1 text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(fuelStats.totalFuelCost)}</p></Card>
              </div>
              <Card dark={dark} title="Top 5 vehicles by fuel consumption" subtitle="Helps identify inefficient vehicles" padding="sm">
                <div className="space-y-2 overflow-x-auto">
                  {fuelStats.topVehiclesFuel.map((row, idx) => {
                    const maxFuel = Math.max(1, ...fuelStats.topVehiclesFuel.map((item) => item.fuel));
                    const width = Math.max(10, Math.round((row.fuel / maxFuel) * 100));
                    return (
                      <div key={`${row.plate}-${idx}`} className="flex min-w-[700px] items-center gap-3 text-sm">
                        <span className={`min-w-[320px] whitespace-nowrap ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{row.plate}</span>
                        <div className={`flex-1 h-2 rounded-full overflow-hidden ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          <div className={`${idx === 0 ? 'bg-brand' : dark ? 'bg-brand/50' : 'bg-brand/40'} h-full rounded-full`} style={{ width: `${width}%` }} />
                        </div>
                        <span className={`w-16 text-right ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{formatNumber(row.fuel)} L</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </section>

            <section className="space-y-3">
              <h2 className={sectionSubtitleClass}>
                <span className={sectionIndexClass}>3</span>
                <span>Maintenance Summary</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                <Card dark={dark} padding="sm"><p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>Jobs completed</p><p className={`mt-1 text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{formatNumber(maintenanceStats.jobsCompleted)}</p></Card>
                <Card dark={dark} padding="sm"><p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>Total cost</p><p className={`mt-1 text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(maintenanceStats.totalCost)}</p></Card>
                <Card dark={dark} padding="sm"><p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>Avg downtime per job</p><p className={`mt-1 text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{maintenanceStats.avgDowntime.toFixed(1)} days</p></Card>
              </div>
              <Card dark={dark} title="Maintenance cost by vehicle" subtitle="Identify vehicles with high maintenance spend" padding="sm">
                <div className="space-y-2 overflow-x-auto">
                  {maintenanceStats.costByVehicle.map((row) => (
                    <div key={row.plate} className={`flex min-w-[700px] items-center justify-between gap-3 py-2 border-b last:border-b-0 ${dark ? 'border-slate-800' : 'border-slate-100'}`}>
                      <div>
                        <p className={`min-w-[320px] whitespace-nowrap text-sm ${dark ? 'text-slate-200' : 'text-slate-800'}`}>{row.plate}</p>
                        <p className={dark ? 'text-xs text-slate-500' : 'text-xs text-slate-500'}>{row.jobs} jobs{row.types.size ? ` · ${Array.from(row.types).join(', ')}` : ''}</p>
                      </div>
                      <span className={dark ? 'text-sm font-medium text-slate-100' : 'text-sm font-medium text-slate-900'}>{formatCurrency(row.cost)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            <section className="space-y-3">
              <h2 className={sectionSubtitleClass}>
                <span className={sectionIndexClass}>4</span>
                <span>Driver Performance</span>
              </h2>
              <Card dark={dark} title="Driver scorecard" subtitle="Ranked by on-time rate in selected period" padding="sm">
                <div className={`grid grid-cols-5 gap-2 px-1 pb-2 text-[11px] uppercase tracking-wide ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                  <span>Driver</span>
                  <span className="text-right">Trips</span>
                  <span className="text-right">Km</span>
                  <span className="text-right">On-time</span>
                  <span className="text-right">Grade</span>
                </div>
                <div className="space-y-1">
                  {driverScorecard.map((row) => (
                    <div key={row.name} className={`grid grid-cols-5 gap-2 items-center py-2 px-1 border-b last:border-b-0 ${dark ? 'border-slate-800' : 'border-slate-100'}`}>
                      <span className={dark ? 'text-sm text-slate-100' : 'text-sm text-slate-900'}>{row.name}</span>
                      <span className={`text-right text-sm ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{row.trips}</span>
                      <span className={`text-right text-sm ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{formatNumber(row.km)}</span>
                      <span className={`text-right text-sm ${row.onTimeRate >= 90 ? 'text-emerald-500' : row.onTimeRate >= 80 ? 'text-amber-500' : 'text-rose-500'}`}>{row.onTimeRate.toFixed(0)}%</span>
                      <span className="text-right">
                        <Badge size="sm" variant={row.grade.variant}>{row.grade.label}</Badge>
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            <section className="space-y-3">
              <h2 className={sectionSubtitleClass}>
                <span className={sectionIndexClass}>5</span>
                <span>Vehicle Utilization</span>
              </h2>
              <Card dark={dark} title="Utilization rate by vehicle" subtitle="Percent of days in period with active trip" padding="sm">
                <div className="space-y-2 overflow-x-auto">
                  {utilization.rows.map((row) => {
                    const tone = row.rate >= 70 ? 'bg-emerald-600' : row.rate >= 40 ? 'bg-amber-500' : 'bg-rose-500';
                    const textTone = row.rate >= 70 ? 'text-emerald-500' : row.rate >= 40 ? 'text-amber-500' : 'text-rose-500';
                    return (
                      <div key={row.vehicle} className="flex min-w-[700px] items-center gap-3 text-sm">
                        <span className={`min-w-[320px] whitespace-nowrap ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{row.vehicle}</span>
                        <div className={`flex-1 h-2 rounded-full overflow-hidden ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          <div className={`${tone} h-full rounded-full`} style={{ width: `${Math.max(6, row.rate)}%` }} />
                        </div>
                        <span className={`w-14 text-right font-medium ${textTone}`}>{row.rate.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
