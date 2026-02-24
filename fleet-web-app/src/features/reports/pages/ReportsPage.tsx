import { useState } from "react";

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
import { useRef } from "react";
const ReportsPage = () => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [reportType, setReportType] = useState("overview");
  const [dateRange, setDateRange] = useState("month");

  return (
    <>
      <div className="space-y-6">
        <ReportsHeader />
        <ReportsFilters
          reportType={reportType}
          onReportTypeChange={setReportType}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
        <div ref={pdfRef} id="pdf-content">
          <OverviewStats stats={overviewStats} />
          <VehiclePerformanceTable vehicles={vehiclePerformance} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FuelAnalysis fuelData={fuelAnalysis} />
            <MaintenanceSummary maintenanceData={maintenanceSummary} />
          </div>
          <MonthlyTrends trends={monthlyTrends} />
        </div>
      </div>
    </>
  );
};

export default ReportsPage;
