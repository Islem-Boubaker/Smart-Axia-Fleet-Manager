import { Card } from '../../../../shared/components';

interface UtilizationRow {
  vehicle: string;
  rate: number;
}

interface Props {
  utilization: {
    rows: UtilizationRow[];
    recommendation: string | null;
  };
  dark: boolean;
  sectionSubtitleClass: string;
  sectionIndexClass: string;
}

const UtilizationSection = ({ utilization, dark, sectionSubtitleClass, sectionIndexClass }: Props) => (
  <section className="space-y-3">
    <h2 className={sectionSubtitleClass}>
      <span className={sectionIndexClass}>5</span>
      <span>Vehicle Utilization</span>
    </h2>

    <Card dark={dark} title="Utilization rate by vehicle" subtitle="Percent of days in period with active trip" padding="sm">
      <div className="space-y-2 overflow-x-auto">
        {utilization.rows.map((row) => {
          const tone =
            row.rate >= 70 ? 'bg-emerald-600' : row.rate >= 40 ? 'bg-amber-500' : 'bg-rose-500';
          const textTone =
            row.rate >= 70 ? 'text-emerald-500' : row.rate >= 40 ? 'text-amber-500' : 'text-rose-500';
          return (
            <div key={row.vehicle} className="flex min-w-[700px] items-center gap-3 text-sm">
              <span className={`min-w-[320px] whitespace-nowrap ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                {row.vehicle}
              </span>
              <div className={`flex-1 h-2 rounded-full overflow-hidden ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div
                  className={`${tone} h-full rounded-full`}
                  style={{ width: `${Math.max(6, row.rate)}%` }}
                />
              </div>
              <span className={`w-14 text-right font-medium ${textTone}`}>{row.rate.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
      {utilization.recommendation && (
        <p className={`mt-3 text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          {utilization.recommendation}
        </p>
      )}
    </Card>
  </section>
);

export default UtilizationSection;