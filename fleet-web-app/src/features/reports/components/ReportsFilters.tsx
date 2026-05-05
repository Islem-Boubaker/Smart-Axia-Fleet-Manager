import { Card, Select } from '../../../shared/components';
import { useTranslation } from 'react-i18next';

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
}: Props) => {
  const { t } = useTranslation();
  return (
    <Card
      padding="lg"
      dark={dark}
      className={dark ? 'border-slate-700/80 shadow-none ring-1 ring-white/[0.04]' : 'border-slate-200/90 shadow-glass bg-white/85'}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
        <Select
          className="w-full sm:flex-1 min-w-0"
          value={reportType}
          onChange={onReportTypeChange}
          dark={dark}
          options={[
            { value: 'overview', label: t('reports.sections.overview') },
            { value: 'vehicles', label: t('reports.sections.vehicles') },
            { value: 'fuel', label: t('reports.sections.fuel') },
            { value: 'maintenance', label: t('reports.sections.maintenance') },
          ]}
        />
        <Select
          className="w-full sm:flex-1 min-w-0"
          value={dateRange}
          onChange={onDateRangeChange}
          dark={dark}
          options={[
            { value: 'month', label: t('reports.filters.this_month') },
            { value: 'quarter', label: t('reports.filters.last_3_months') },
            { value: 'halfyear', label: t('reports.filters.last_6_months') },
            { value: 'year', label: t('reports.filters.this_year') },
            { value: 'custom', label: t('reports.filters.custom_range') },
          ]}
        />
      </div>
    </Card>
  );
};

export default ReportsFilters;