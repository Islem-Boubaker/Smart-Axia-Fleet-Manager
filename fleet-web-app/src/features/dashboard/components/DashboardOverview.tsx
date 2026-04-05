import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowUpRight,
  FiClock,
  FiMapPin,
  FiNavigation,
  FiTrendingUp,
} from 'react-icons/fi';
import { MdOutlineDirectionsCar, MdOutlineSchedule } from 'react-icons/md';
import { ROUTES } from '../../../utils/constants';

interface DashboardOverviewProps {
  dark: boolean;
}

const CURRENT_TASK = {
  vehicle: 'Toyota Camry',
  plate: '123 TU 4567',
  timeLeft: '2h 15m remaining',
};

const UPCOMING_TASK = {
  vehicle: 'Ford Transit',
  plate: '234 TU 8912',
  timeLeft: 'Starts 14:30',
};

const RECENT_TRIPS = [
  {
    id: '1',
    vehicle: 'Toyota Camry',
    route: 'TUN → SFX',
    meta: 'TR-2048 · 270 km',
    status: 'completed' as const,
  },
  {
    id: '2',
    vehicle: 'Tesla Model 3',
    route: 'NAB → MON',
    meta: 'TR-2049 · 85 km',
    status: 'active' as const,
  },
  {
    id: '3',
    vehicle: 'Chevrolet Malibu',
    route: 'BIZ → TUN',
    meta: 'TR-2050 · 95 km',
    status: 'pending' as const,
  },
];

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
};

const DashboardOverview = ({ dark }: DashboardOverviewProps) => {
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
            {greeting}, Bedis
          </h1>
          <p className={`text-sm sm:text-base ${sub}`}>
            Tuesday — <span className="font-medium text-brand">2 trips</span> on the schedule today. Fleet is running
            smoothly.
          </p>
        </div>

        <div
          className={`xl:mb-1 shrink-0 rounded-2xl border px-5 py-4 max-w-md w-full xl:w-auto xl:min-w-[280px] transition-transform duration-300 hover:-translate-y-0.5 ${panel}`}
          style={{ animationDelay: '80ms' }}
        >
          <p className={`text-[11px] font-semibold uppercase tracking-wider ${muted}`}>Current location</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${dark ? 'bg-slate-800' : 'bg-brand-light'}`}>
              <FiMapPin className={dark ? 'text-sky-400' : 'text-brand'} />
            </span>
            <div>
              <p className={`font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>Tunis, Tunisia</p>
              <p className={`text-xs ${muted}`}>Last updated just now</p>
            </div>
          </div>
        </div>
      </div>

      {/* Task cards — different visual weight (not equal columns) */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-5 md:items-stretch">
        <div
          className={`md:flex-[1.2] rounded-[20px] p-6 text-white shadow-soft bg-gradient-to-br from-emerald-600 to-emerald-700 ring-1 ring-emerald-500/30 transition duration-300 hover:-translate-y-1 hover:shadow-lg`}
          style={{ animationDelay: '120ms' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/75">Current task</p>
          <p className="mt-3 text-xl font-bold">{CURRENT_TASK.vehicle}</p>
          <p className="text-sm text-white/80">{CURRENT_TASK.plate}</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-white/85">
            <FiClock className="shrink-0 opacity-90" />
            <span>{CURRENT_TASK.timeLeft}</span>
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
          <p className={`mt-3 text-xl font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{UPCOMING_TASK.vehicle}</p>
          <p className={`text-sm ${muted}`}>{UPCOMING_TASK.plate}</p>
          <div className={`mt-4 flex items-center gap-2 text-sm ${sub}`}>
            <MdOutlineSchedule className="shrink-0 text-lg opacity-80" />
            <span>{UPCOMING_TASK.timeLeft}</span>
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
          { label: 'Active vehicles', value: '24', icon: MdOutlineDirectionsCar, wide: true },
          { label: 'On-time %', value: '96', suffix: '%', icon: FiTrendingUp, wide: false },
          { label: 'Open maintenance', value: '3', icon: FiNavigation, wide: false },
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
              </p>
            </div>
          </div>
        ))}
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
          {RECENT_TRIPS.map((trip, index) => {
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
