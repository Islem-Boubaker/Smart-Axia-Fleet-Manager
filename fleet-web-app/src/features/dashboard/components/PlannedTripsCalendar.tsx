import { FiCalendar, FiChevronDown, FiExternalLink, FiFilter } from 'react-icons/fi';
import type { DashboardWeekDay } from '../hooks/useDashboard';

interface PlannedTripsCalendarProps {
  dark: boolean;
  weekRange: string;
  weekDays: DashboardWeekDay[];
}

const PlannedTripsCalendar = ({ dark, weekRange, weekDays }: PlannedTripsCalendarProps) => {

  const panel = dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200';
  const muted = dark ? 'text-slate-300' : 'text-gray-700';
  const rowBorder = dark ? 'border-slate-700' : 'border-gray-100';
  const dayChipBase = dark ? 'bg-slate-800 text-slate-200' : 'bg-gray-100 text-gray-600';
  const tripsCard = dark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-gray-900';

  return (
    <section className={`rounded-3xl border shadow-sm overflow-hidden ${panel}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-6 pt-6 pb-4">
        <h2 className={`text-4xl font-semibold tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>Planned Trips</h2>

        <div className="flex items-center gap-2 flex-wrap">
          <button className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition-colors ${dark ? 'border-slate-600 text-slate-200 hover:bg-slate-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            <FiCalendar className={`w-4 h-4 ${dark ? 'text-slate-400' : 'text-gray-500'}`} />
            {weekRange}
            <FiChevronDown className={`w-4 h-4 ${dark ? 'text-slate-400' : 'text-gray-400'}`} />
          </button>

          <button className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition-colors ${dark ? 'border-slate-600 text-slate-200 hover:bg-slate-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            <FiFilter className={`w-4 h-4 ${dark ? 'text-slate-400' : 'text-gray-500'}`} />
            Filter
          </button>

          <button className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition-colors ${dark ? 'border-slate-600 text-slate-200 hover:bg-slate-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            <FiExternalLink className={`w-4 h-4 ${dark ? 'text-slate-400' : 'text-gray-500'}`} />
            View all
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-5">
        <div className="min-w-[920px] px-4">
          <div className={`grid grid-cols-7 gap-2 border-b ${rowBorder} pb-4`}>
            {weekDays.map((day) => (
              <div
                key={day.date.toISOString()}
                className={`rounded-xl px-3 py-2 text-center ${
                  day.isToday ? 'bg-blue-500 text-white' : dayChipBase
                }`}
              >
                <div className="text-xs font-medium">{day.dayLabel}</div>
                <div className="text-lg font-bold leading-tight">{day.dayNumber}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mt-4">
            {weekDays.map((day) => (
              <div key={`count-${day.date.toISOString()}`} className={`rounded-2xl border p-4 ${tripsCard}`}>
                <div className={`text-xs uppercase tracking-wider mb-2 ${muted}`}>Trips</div>
                <div className="text-3xl font-extrabold leading-none">{day.tripsCount}</div>
                <div className={`text-xs mt-2 ${muted}`}>scheduled on {day.dayLabel}</div>
                <div className={`mt-4 h-2 w-full rounded-full ${dark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                  <div
                    className="h-2 rounded-full bg-brand"
                    style={{ width: `${Math.min(100, day.tripsCount * 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlannedTripsCalendar;
