import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowUpRight,
  FiClock,
  FiNavigation,
  FiTrendingUp,
} from 'react-icons/fi';
import { MdOutlineDirectionsCar, MdOutlineSchedule } from 'react-icons/md';
import { ROUTES } from '../../../utils/constants';
import { useAppSelector } from '../../../shared/hooks/useRedux';
import type { DashboardRecentTrip, DashboardTask } from '../hooks/useDashboard';

interface DashboardOverviewProps {
  dark: boolean;
  isLoading: boolean;
  totalVehicles: number;
  activeVehicles: number;
  activeDrivers: number;
  completionRate: number;
  openMaintenanceCount: number;
  currentTask: DashboardTask;
  upcomingTask: DashboardTask;
  recentTrips: DashboardRecentTrip[];
  topDrivers: { name: string; trips: number }[];
}

const statusStyles = {
  completed: {
    label: 'Completed',
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-500/15',
  },
  active: {
    label: 'Active',
    pill: 'bg-blue-50 text-blue-700 ring-blue-500/15',
  },
  pending: {
    label: 'Pending',
    pill: 'bg-amber-50 text-amber-700 ring-amber-500/15',
  },
  cancelled: {
    label: 'Cancelled',
    pill: 'bg-red-50 text-red-700 ring-red-500/15',
  },
};

const DashboardOverview = ({
  dark,
  isLoading,
  totalVehicles,
  activeVehicles,
  activeDrivers,
  completionRate,
  openMaintenanceCount,
  currentTask,
  upcomingTask,
  recentTrips,
  topDrivers,
}: DashboardOverviewProps) => {
  const user = useAppSelector((state) => state.auth.user);
  
  const panel = dark
    ? 'border-slate-700/80 bg-slate-900/50 backdrop-blur-sm'
    : 'border-slate-200/90 bg-white/80 backdrop-blur-sm shadow-soft';
  const muted = dark ? 'text-slate-400' : 'text-slate-500';
  const sub = dark ? 'text-slate-500' : 'text-slate-600';

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <section className="space-y-10 lg:space-y-12 animate-fade-in">
      {/* Hero — asymmetric: text left, floating location right */}
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-8 xl:gap-12">
        <div className="max-w-2xl space-y-2 animate-fade-up" style={{ animationDelay: '40ms' }}>
          <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${muted}`}>Overview</p>
          <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
            {greeting}, {user?.name?.split(' ')[0] || 'User'}
          </h1>
        </div>
      </div>

      {/* Task cards — different visual weight (not equal columns) */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-5 md:items-stretch">
        <div
          className={`md:flex-[1.2] rounded-[20px] p-6 text-white shadow-soft bg-gradient-to-br from-emerald-600 to-emerald-700 ring-1 ring-emerald-500/30 transition duration-300 hover:-translate-y-1 hover:shadow-lg`}
          style={{ animationDelay: '120ms' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/75">Current task</p>
          <p className="mt-3 text-xl font-bold">{currentTask.vehicle}</p>
          <p className="text-sm text-white/80">{currentTask.plate}</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-white/85">
            <FiClock className="shrink-0 opacity-90" />
            <span>{currentTask.timeLeft}</span>
          </div>
          <button
            type="button"
            className="mt-6 w-full rounded-xl bg-white/20 py-2.5 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/30"
          >
            Task details
          </button>
        </div>

        <div
          className={`md:flex-[0.85] md:mt-6 rounded-[20px] border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-soft ${panel}`}
          style={{ animationDelay: '160ms' }}
        >
          <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${dark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            Upcoming task
          </p>
          <p className={`mt-3 text-xl font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{upcomingTask.vehicle}</p>
          <p className={`text-sm ${muted}`}>{upcomingTask.plate}</p>
          <div className={`mt-4 flex items-center gap-2 text-sm ${sub}`}>
            <MdOutlineSchedule className="shrink-0 text-lg opacity-80" />
            <span>{upcomingTask.timeLeft}</span>
          </div>
          <button
            type="button"
            className={`mt-6 w-full rounded-xl border py-2.5 text-sm font-semibold transition ${
              dark
                ? 'border-slate-600 text-slate-200 hover:bg-slate-800'
                : 'border-slate-200 bg-white/60 text-slate-800 hover:bg-white'
            }`}
          >
            View schedule
          </button>
        </div>
      </div>

      {/* Floating stat chips — non-uniform sizes */}
      <div className="flex flex-wrap gap-3 lg:gap-4">
        {[
          { label: 'Active vehicles', value: String(activeVehicles), extra: `/ ${totalVehicles}`, icon: MdOutlineDirectionsCar, wide: true },
          { label: 'Trip completion', value: String(completionRate), suffix: '%', icon: FiTrendingUp, wide: false },
          { label: 'Open maintenance', value: String(openMaintenanceCount), icon: FiNavigation, wide: false },
        ].map((s, i) => (
          <div
            key={s.label}
            className={`rounded-2xl border px-4 py-3 flex items-center gap-3 transition hover:-translate-y-0.5 hover:shadow-soft ${
              s.wide ? 'min-w-[200px] flex-[1.15]' : 'min-w-[140px]'
            } ${panel}`}
            style={{ animationDelay: `${200 + i * 40}ms` }}
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                dark ? 'bg-slate-800 text-brand' : 'bg-brand-light text-brand-deep'
              }`}
            >
              <s.icon className="w-5 h-5" />
            </span>
            <div>
              <p className={`text-[11px] font-medium uppercase tracking-wide ${muted}`}>{s.label}</p>
              <p className={`text-2xl font-extrabold tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}>
                {s.value}
                {s.suffix && <span className="text-lg font-bold">{s.suffix}</span>}
                {s.extra && <span className={`text-sm font-semibold ml-1 ${muted}`}>{s.extra}</span>}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className={`rounded-[24px] border p-5 sm:p-6 ${panel}`}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className={`text-base font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>Top drivers</h3>
          <span className={`text-sm ${muted}`}>{activeDrivers} active</span>
        </div>
        {topDrivers.length === 0 ? (
          <p className={`text-sm ${muted}`}>No driver trip activity yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {topDrivers.map((driver) => (
              <li key={driver.name} className={`flex items-center justify-between rounded-xl px-3 py-2 ${dark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <span className={`text-sm font-medium ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{driver.name}</span>
                <span className={`text-sm ${muted}`}>{driver.trips} trips</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent trips — staggered widths */}
      <div className={`rounded-[24px] border p-6 sm:p-8 ${panel}`}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h2 className={`text-lg font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>Recent trips</h2>
            <p className={`text-sm mt-0.5 ${muted}`}>Latest activity across your fleet</p>
          </div>
          <Link
            to={ROUTES.TRIPS}
            className={`inline-flex items-center gap-1 text-sm font-semibold transition hover:gap-2 ${
              dark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'
            }`}
          >
            View all
            <FiArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <ul className="space-y-3">
          {isLoading ? (
            <li className={`rounded-2xl border p-4 sm:p-5 ${dark ? 'border-slate-700/80 bg-slate-800/40 text-slate-400' : 'border-slate-200/90 bg-white/60 text-slate-500'}`}>
              Loading recent trips...
            </li>
          ) : recentTrips.length === 0 ? (
            <li className={`rounded-2xl border p-4 sm:p-5 ${dark ? 'border-slate-700/80 bg-slate-800/40 text-slate-400' : 'border-slate-200/90 bg-white/60 text-slate-500'}`}>
              No trips available yet.
            </li>
          ) : recentTrips.map((trip, index) => {
            const st = statusStyles[trip.status];
            const stagger = index % 2 === 1 ? 'lg:ml-10' : '';
            return (
              <li
                key={trip.id}
                className={`rounded-2xl border p-4 sm:p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-soft ${
                  dark ? 'border-slate-700/80 bg-slate-800/40' : 'border-slate-200/90 bg-white/60'
                } max-w-full ${stagger}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className={`font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{trip.vehicle}</p>
                    <p className={`text-sm mt-0.5 ${sub}`}>{trip.route}</p>
                    <p className={`text-xs mt-1 ${muted}`}>{trip.meta}</p>
                  </div>
                  <span
                    className={`self-start sm:self-center inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${st.pill}`}
                  >
                    {st.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default DashboardOverview;
