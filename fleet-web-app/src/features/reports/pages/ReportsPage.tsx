import { useState, useRef } from "react";
import { useOutletContext } from 'react-router-dom';

import ReportsHeader from "../components/ReportsHeader";
import ReportsFilters from "../components/ReportsFilters";
import OverviewStats from "../components/OverviewStats";
import VehiclePerformanceTable from "../components/VehiclePerformanceTable";
import FuelAnalysis from "../components/FuelAnalysis";
import MaintenanceSummary from "../components/MaintenanceSummary";
import MonthlyTrends from "../components/MonthlyTrends";
import DriverInsights from "../components/DriverInsights";
import { useReports } from "../hooks/useReports";

interface ThemeContext {
  dark: boolean;
}

const ReportsPage = () => {
  const { dark } = useOutletContext<ThemeContext>();
  const pdfRef = useRef<HTMLDivElement>(null);
  const [reportType, setReportType] = useState("overview");
  const [dateRange, setDateRange] = useState("month");
  const {
    isLoading,
    error,
    overviewStats,
    vehiclePerformance,
    fuelAnalysis,
    maintenanceSummary,
    monthlyTrends,
    driverInsights,
    driverPerformance,
  } = useReports(reportType, dateRange);

  return (
    <div
      className={`rounded-[24px] border p-6 sm:p-8 lg:p-10 space-y-8 lg:space-y-10 ${
        dark
          ? 'border-slate-700/80 bg-slate-900/35 backdrop-blur-sm'
          : 'border-slate-200/90 bg-white/70 backdrop-blur-md shadow-soft'
      }`}
    >
      <ReportsHeader dark={dark} />
      <ReportsFilters
        reportType={reportType}
        onReportTypeChange={setReportType}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        dark={dark}
      />
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
            <OverviewStats stats={overviewStats} dark={dark} />
            <DriverInsights summary={driverInsights} rows={driverPerformance} dark={dark} />
            <VehiclePerformanceTable vehicles={vehiclePerformance} dark={dark} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
              <FuelAnalysis fuelData={fuelAnalysis} dark={dark} />
              <MaintenanceSummary maintenanceData={maintenanceSummary} dark={dark} />
            </div>
            <MonthlyTrends trends={monthlyTrends} dark={dark} />
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
