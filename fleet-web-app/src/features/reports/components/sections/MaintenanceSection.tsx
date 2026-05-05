import { Card } from '../../../../shared/components';
import { useTranslation } from 'react-i18next';

interface MaintenanceStats {
  jobsCompleted: number;
  totalCost: number;
  avgDowntime: number;
  costByVehicle: { plate: string; cost: number; jobs: number; types: Set<string> }[];
}

interface Props {
  maintenanceStats: MaintenanceStats;
  dark: boolean;
  sectionSubtitleClass: string;
  sectionIndexClass: string;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.max(0, value));

const formatCurrency = (value: number) => `${formatNumber(value)} TND`;

const MaintenanceSection = ({ maintenanceStats, dark, sectionSubtitleClass, sectionIndexClass }: Props) => {
  const { t } = useTranslation();
  return (
    <section className="space-y-3">
      <h2 className={sectionSubtitleClass}>
        <span className={sectionIndexClass}>3</span>
        <span>{t('reports.maintenance.title')}</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <Card dark={dark} padding="sm">
          <p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>{t('reports.maintenance.jobsCompleted')}</p>
          <p className={`mt-1 text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
            {formatNumber(maintenanceStats.jobsCompleted)}
          </p>
        </Card>
        <Card dark={dark} padding="sm">
          <p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>{t('reports.maintenance.totalCost')}</p>
          <p className={`mt-1 text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
            {formatCurrency(maintenanceStats.totalCost)}
          </p>
        </Card>
        <Card dark={dark} padding="sm">
          <p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>{t('reports.maintenance.avgDowntime')}</p>
          <p className={`mt-1 text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
            {t('reports.maintenance.avgDowntimeValue', { value: maintenanceStats.avgDowntime.toFixed(1) })}
          </p>
        </Card>
      </div>

      <Card dark={dark} title={t('reports.maintenance.costByVehicleTitle')} subtitle={t('reports.maintenance.costByVehicleSubtitle')} padding="sm">
        <div className="space-y-2 overflow-x-auto">
          {maintenanceStats.costByVehicle.map((row) => (
            <div
              key={row.plate}
              className={`flex min-w-[700px] items-center justify-between gap-3 py-2 border-b last:border-b-0 ${
                dark ? 'border-slate-800' : 'border-slate-100'
              }`}
            >
              <div>
                <p className={`min-w-[320px] whitespace-nowrap text-sm ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {row.plate}
                </p>
                <p className={dark ? 'text-xs text-slate-500' : 'text-xs text-slate-500'}>
                  {t('reports.maintenance.jobsLabel', { count: row.jobs })}
                  {row.types.size ? ` · ${Array.from(row.types).join(', ')}` : ''}
                </p>
              </div>
              <span className={dark ? 'text-sm font-medium text-slate-100' : 'text-sm font-medium text-slate-900'}>
                {formatCurrency(row.cost)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
};

export default MaintenanceSection;