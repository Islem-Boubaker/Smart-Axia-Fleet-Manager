import { useState, useRef } from "react";
import { useOutletContext } from 'react-router-dom';

import ReportsHeader from "../components/ReportsHeader";
import ReportsFilters from "../components/ReportsFilters";
import OverviewStats from "../components/OverviewStats";
import VehiclePerformanceTable from "../components/VehiclePerformanceTable";
import FuelAnalysis from "../components/FuelAnalysis";
import MaintenanceSummary from "../components/MaintenanceSummary";
import MonthlyTrends from "../components/MonthlyTrends";
import {
  overviewStats,
  vehiclePerformance,
  fuelAnalysis,
  monthlyTrends,
  maintenanceSummary,
} from "../../../data/mockData";

interface ThemeContext {
  dark: boolean;
}

const ReportsPage = () => {
  const { dark } = useOutletContext<ThemeContext>();
  const pdfRef = useRef<HTMLDivElement>(null);
  const [reportType, setReportType] = useState("overview");
  const [dateRange, setDateRange] = useState("month");

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
      <div ref={pdfRef} id="pdf-content" className="space-y-8 lg:space-y-10">
        <OverviewStats stats={overviewStats} dark={dark} />
        <VehiclePerformanceTable vehicles={vehiclePerformance} dark={dark} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          <FuelAnalysis fuelData={fuelAnalysis} dark={dark} />
          <MaintenanceSummary maintenanceData={maintenanceSummary} dark={dark} />
        </div>
        <MonthlyTrends trends={monthlyTrends} dark={dark} />
      </div>
    </div>
  );
};

export default ReportsPage;
