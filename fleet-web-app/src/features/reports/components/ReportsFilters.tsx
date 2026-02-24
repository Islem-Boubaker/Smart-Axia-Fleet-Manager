import { Card } from '../../../shared/components';

interface Props {
  reportType: string;
  onReportTypeChange: (value: string) => void;
  dateRange: string;
  onDateRangeChange: (value: string) => void;
}

const ReportsFilters = ({ reportType, onReportTypeChange, dateRange, onDateRangeChange }: Props) => (
  <Card>
    <div className="flex flex-col sm:flex-row gap-4">
      <select value={reportType} onChange={e => onReportTypeChange(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="overview">Overview</option>
        <option value="vehicles">Vehicle Performance</option>
        <option value="fuel">Fuel Analysis</option>
        <option value="maintenance">Maintenance</option>
      </select>
      <select value={dateRange} onChange={e => onDateRangeChange(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="week">Last 7 Days</option>
        <option value="month">Last 30 Days</option>
        <option value="quarter">Last 3 Months</option>
        <option value="year">Last Year</option>
      </select>
    </div>
  </Card>
);

export default ReportsFilters;