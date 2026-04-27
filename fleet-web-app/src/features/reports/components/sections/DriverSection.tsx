import { Badge, Card } from '../../../../shared/components';

interface DriverRow {
  name: string;
  trips: number;
  km: number;
  onTimeRate: number;
  grade: { label: string; variant: 'success' | 'warning' | 'error' };
}

interface Props {
  driverScorecard: DriverRow[];
  dark: boolean;
  sectionSubtitleClass: string;
  sectionIndexClass: string;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.max(0, value));

const DriverSection = ({ driverScorecard, dark, sectionSubtitleClass, sectionIndexClass }: Props) => (
  <section className="space-y-3">
    <h2 className={sectionSubtitleClass}>
      <span className={sectionIndexClass}>4</span>
      <span>Driver Performance</span>
    </h2>

    <Card dark={dark} title="Driver scorecard" subtitle="Ranked by on-time rate in selected period" padding="sm">
      <div className={`grid grid-cols-5 gap-2 px-1 pb-2 text-[11px] uppercase tracking-wide ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
        <span>Driver</span>
        <span className="text-right">Trips</span>
        <span className="text-right">Km</span>
        <span className="text-right">On-time</span>
        <span className="text-right">Grade</span>
      </div>
      <div className="space-y-1">
        {driverScorecard.map((row) => (
          <div
            key={row.name}
            className={`grid grid-cols-5 gap-2 items-center py-2 px-1 border-b last:border-b-0 ${
              dark ? 'border-slate-800' : 'border-slate-100'
            }`}
          >
            <span className={dark ? 'text-sm text-slate-100' : 'text-sm text-slate-900'}>{row.name}</span>
            <span className={`text-right text-sm ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{row.trips}</span>
            <span className={`text-right text-sm ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
              {formatNumber(row.km)}
            </span>
            <span
              className={`text-right text-sm ${
                row.onTimeRate >= 90
                  ? 'text-emerald-500'
                  : row.onTimeRate >= 80
                  ? 'text-amber-500'
                  : 'text-rose-500'
              }`}
            >
              {row.onTimeRate.toFixed(0)}%
            </span>
            <span className="text-right">
              <Badge size="sm" variant={row.grade.variant}>{row.grade.label}</Badge>
            </span>
          </div>
        ))}
      </div>
    </Card>
  </section>
);

export default DriverSection;