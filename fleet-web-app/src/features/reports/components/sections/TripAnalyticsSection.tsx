import { Card } from '../../../../shared/components';
import { useTranslation } from 'react-i18next';

interface TripAnalytics {
  totalTrips: number;
  totalKm: number;
  onTimeRate: number;
  cancellationRate: number;
  tripDelta: number;
  weeklyBuckets: { label: string; value: number }[];
}

interface Props {
  analytics: TripAnalytics;
  dark: boolean;
  sectionSubtitleClass: string;
  sectionIndexClass: string;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.max(0, value));

const TripAnalyticsSection = ({ analytics, dark, sectionSubtitleClass, sectionIndexClass }: Props) => {
  const { t } = useTranslation();
  return (
    <section className="space-y-3">
      <h2 className={sectionSubtitleClass}>
        <span className={sectionIndexClass}>1</span>
        <span>{t('reports.trip_analytics.title')}</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <Card dark={dark} padding="sm">
          <p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>{t('reports.trip_analytics.total_trips')}</p>
          <p className={`mt-1 text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
            {formatNumber(analytics.totalTrips)}
          </p>
        </Card>
        <Card dark={dark} padding="sm">
          <p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>{t('reports.trip_analytics.total_km')}</p>
          <p className={`mt-1 text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
            {formatNumber(analytics.totalKm)}
          </p>
        </Card>
        <Card dark={dark} padding="sm">
          <p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>{t('reports.trip_analytics.on_time_rate')}</p>
          <p className={`mt-1 text-2xl font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
            {analytics.onTimeRate.toFixed(1)}%
          </p>
        </Card>
        <Card dark={dark} padding="sm">
          <p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>{t('reports.trip_analytics.cancellation_rate')}</p>
          <p className={`mt-1 text-2xl font-semibold ${dark ? 'text-amber-300' : 'text-amber-600'}`}>
            {analytics.cancellationRate.toFixed(1)}%
          </p>
        </Card>
      </div>

      <Card dark={dark} title={t('reports.trip_analytics.trips_per_week')} subtitle={t('reports.trip_analytics.volume_trend')} padding="sm">
        <div className="space-y-3">
          <div className="flex items-end gap-1 h-16">
            {analytics.weeklyBuckets.map((bucket, index) => {
              const maxValue = Math.max(1, ...analytics.weeklyBuckets.map((item) => item.value));
              const height = Math.max(10, Math.round((bucket.value / maxValue) * 100));
              return (
                <div
                  key={bucket.label}
                  title={t('reports.trip_analytics.bucket_title', { count: bucket.value })}
                  className={`flex-1 rounded-t ${
                    index === analytics.weeklyBuckets.length - 1
                      ? 'bg-brand'
                      : dark
                      ? 'bg-brand/45'
                      : 'bg-brand/35'
                  }`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
          <div className={`flex justify-between text-[11px] ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
            {analytics.weeklyBuckets.map((bucket) => (
              <span key={bucket.label}>{bucket.label}</span>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
};

export default TripAnalyticsSection;