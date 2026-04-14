import { Card, Select } from '../../../shared/components';

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
      <Select
        className="w-full sm:flex-1 min-w-0"
        value={reportType}
        onChange={onReportTypeChange}
        dark={dark}
        options={[
          { value: 'overview', label: 'Overview' },
          { value: 'vehicles', label: 'Vehicle Performance' },
          { value: 'fuel', label: 'Fuel Analysis' },
          { value: 'maintenance', label: 'Maintenance' },
        ]}
      />
      <Select
        className="w-full sm:flex-1 min-w-0"
        value={dateRange}
        onChange={onDateRangeChange}
        dark={dark}
        options={[
          { value: 'week', label: 'Last 7 Days' },
          { value: 'month', label: 'Last 30 Days' },
          { value: 'quarter', label: 'Last 3 Months' },
          { value: 'year', label: 'Last Year' },
        ]}
      />
    </div>
  </Card>
);

export default ReportsFilters;