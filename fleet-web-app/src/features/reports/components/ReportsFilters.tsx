import { Card } from '../../../shared/components';

interface Props {
  reportType: string;
  onReportTypeChange: (value: string) => void;
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  dark?: boolean;
}

const ReportsFilters = ({
  reportType,
  onReportTypeChange,
  dateRange,
  onDateRangeChange,
  dark = false,
}: Props) => (
  <Card padding="lg" dark={dark} className={dark ? 'border-slate-700/80 shadow-none' : 'border-slate-200/90 shadow-glass'}>
    <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
      <select
        value={reportType}
        onChange={(e) => onReportTypeChange(e.target.value)}
        className={`w-full sm:flex-1 min-w-0 px-4 py-3 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow ${
          dark
            ? 'border-slate-600 bg-slate-800/80 text-slate-100'
            : 'border-gray-200 bg-white text-gray-900'
        }`}
      >
        <option value="overview">Overview</option>
        <option value="vehicles">Vehicle Performance</option>
        <option value="fuel">Fuel Analysis</option>
        <option value="maintenance">Maintenance</option>
      </select>
      <select
        value={dateRange}
        onChange={(e) => onDateRangeChange(e.target.value)}
        className={`w-full sm:flex-1 min-w-0 px-4 py-3 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow ${
          dark
            ? 'border-slate-600 bg-slate-800/80 text-slate-100'
            : 'border-gray-200 bg-white text-gray-900'
        }`}
      >
        <option value="week">Last 7 Days</option>
        <option value="month">Last 30 Days</option>
        <option value="quarter">Last 3 Months</option>
        <option value="year">Last Year</option>
      </select>
    </div>
  </Card>
);

export default ReportsFilters;