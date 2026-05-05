import { Card } from '../../../../shared/components';
import { useTranslation } from 'react-i18next';

interface FuelStats {
  totalFuel: number;
  avgFuelPer100: number;
  totalFuelCost: number;
  topVehiclesFuel: { plate: string; fuel: number }[];
}

interface Props {
  fuelStats: FuelStats;
  dark: boolean;
  sectionSubtitleClass: string;
  sectionIndexClass: string;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.max(0, value));

const formatCurrency = (value: number) => `${formatNumber(value)} TND`;

const FuelSection = ({ fuelStats, dark, sectionSubtitleClass, sectionIndexClass }: Props) => {
  const { t } = useTranslation();
  return (
    <section className="space-y-3">
      <h2 className={sectionSubtitleClass}>
        <span className={sectionIndexClass}>2</span>
        <span>{t('reports.fuel.title')}</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <Card dark={dark} padding="sm">
          <p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>{t('reports.fuel.total_consumed')}</p>
          <p className={`mt-1 text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
            {formatNumber(fuelStats.totalFuel)} {t('common.liters')}
          </p>
        </Card>
        <Card dark={dark} padding="sm">
          <p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>{t('reports.fuel.avg_per_100km')}</p>
          <p className={`mt-1 text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
            {fuelStats.avgFuelPer100.toFixed(1)} {t('common.liters')}
          </p>
        </Card>
        <Card dark={dark} padding="sm">
          <p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>{t('reports.fuel.total_cost')}</p>
          <p className={`mt-1 text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
            {formatCurrency(fuelStats.totalFuelCost)}
          </p>
        </Card>
      </div>

      <Card dark={dark} title={t('reports.fuel.topVehiclesTitle')} subtitle={t('reports.fuel.topVehiclesSubtitle')} padding="sm">
        <div className="space-y-2 overflow-x-auto">
          {fuelStats.topVehiclesFuel.map((row, idx) => {
            const maxFuel = Math.max(1, ...fuelStats.topVehiclesFuel.map((item) => item.fuel));
            const width = Math.max(10, Math.round((row.fuel / maxFuel) * 100));
            return (
              <div key={`${row.plate}-${idx}`} className="flex min-w-[700px] items-center gap-3 text-sm">
                <span className={`min-w-[320px] whitespace-nowrap ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {row.plate}
                </span>
                <div className={`flex-1 h-2 rounded-full overflow-hidden ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <div
                    className={`${idx === 0 ? 'bg-brand' : dark ? 'bg-brand/50' : 'bg-brand/40'} h-full rounded-full`}
                    style={{ width: `${width}%` }}
                  />
                </div>
                <span className={`w-16 text-right ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {formatNumber(row.fuel)} {t('common.liters')}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
};

export default FuelSection;