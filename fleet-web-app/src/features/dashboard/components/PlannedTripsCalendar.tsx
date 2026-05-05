import { FiCalendar, FiChevronDown, FiExternalLink, FiFilter } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

interface DashboardWeekDay {
  date: Date;
  dayLabel: string;
  dayNumber: string;
  isToday: boolean;
  tripsCount: number;
}

type CalendarTripItem = {
  id: string;
  vehicle: string;
  route: string;
  startTime: string;
};

interface PlannedTripsCalendarProps {
  dark: boolean;
  weekRange: string;
  weekDays: DashboardWeekDay[];
  selectedDayKey: string;
  selectedDayTrips: CalendarTripItem[];
  onSelectDay: (dayKey: string) => void;
  onOpenTrip: (tripId: string) => void;
}

const PlannedTripsCalendar = ({
  dark,
  weekRange,
  weekDays,
  selectedDayKey,
  selectedDayTrips,
  onSelectDay,
  onOpenTrip,
}: PlannedTripsCalendarProps) => {
  const { t, i18n } = useTranslation();

  const panel = dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200';
  const muted = dark ? 'text-slate-300' : 'text-gray-700';
  const rowBorder = dark ? 'border-slate-700' : 'border-gray-100';
  const dayChipBase = dark ? 'bg-slate-800 text-slate-200' : 'bg-gray-100 text-gray-600';
  const tripsCard = dark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-gray-900';

  return (
    <section className={`rounded-3xl border shadow-sm overflow-hidden ${panel}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-6 pt-6 pb-4">
        <h2 className={`text-4xl font-semibold tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>{t('dashboard.plannedTrips.title')}</h2>

        <div className="flex items-center gap-2 flex-wrap">
          <button className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition-colors ${dark ? 'border-slate-600 text-slate-200 hover:bg-slate-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            <FiCalendar className={`w-4 h-4 ${dark ? 'text-slate-400' : 'text-gray-500'}`} />
            {weekRange}
            <FiChevronDown className={`w-4 h-4 ${dark ? 'text-slate-400' : 'text-gray-400'}`} />
          </button>

          <button className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition-colors ${dark ? 'border-slate-600 text-slate-200 hover:bg-slate-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            <FiFilter className={`w-4 h-4 ${dark ? 'text-slate-400' : 'text-gray-500'}`} />
            {t('common.filter')}
          </button>

          <button className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition-colors ${dark ? 'border-slate-600 text-slate-200 hover:bg-slate-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            <FiExternalLink className={`w-4 h-4 ${dark ? 'text-slate-400' : 'text-gray-500'}`} />
            {t('dashboard.plannedTrips.viewAll')}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-5">
        <div className="min-w-[920px] px-4">
          <div className={`grid grid-cols-7 gap-2 border-b ${rowBorder} pb-4`}>
            {weekDays.map((day) => (
              <button
                type="button"
                key={day.date.toISOString()}
                onClick={() => onSelectDay(day.date.toISOString().slice(0, 10))}
                className={`rounded-xl px-3 py-2 text-center ${
                  day.date.toISOString().slice(0, 10) === selectedDayKey
                    ? 'bg-brand text-white'
                    : day.isToday
                      ? 'bg-blue-500 text-white'
                      : dayChipBase
                }`}
              >
                <div className="text-xs font-medium">{day.dayLabel}</div>
                <div className="text-lg font-bold leading-tight">{day.dayNumber}</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mt-4">
            {weekDays.map((day) => (
              <div key={`count-${day.date.toISOString()}`} className={`rounded-2xl border p-4 ${tripsCard}`}>
                <div className={`text-xs uppercase tracking-wider mb-2 ${muted}`}>{t('common.trips')}</div>
                <div className="text-3xl font-extrabold leading-none">{day.tripsCount}</div>
                <div className={`text-xs mt-2 ${muted}`}>{t('dashboard.plannedTrips.scheduledOn', { day: day.dayLabel })}</div>
                <div className={`mt-4 h-2 w-full rounded-full ${dark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                  <div
                    className="h-2 rounded-full bg-brand"
                    style={{ width: `${Math.min(100, day.tripsCount * 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={`mt-4 rounded-2xl border p-4 ${tripsCard}`}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold">{t('dashboard.plannedTrips.selectedDayTitle')}</h3>
              <span className={`text-xs ${muted}`}>{t('dashboard.plannedTrips.tripCount', { count: selectedDayTrips.length })}</span>
            </div>

            {selectedDayTrips.length === 0 ? (
              <p className={`mt-3 text-sm ${muted}`}>{t('dashboard.plannedTrips.emptySelectedDay')}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {selectedDayTrips.map((trip) => (
                  <li key={trip.id} className={`rounded-xl border px-3 py-2 ${dark ? 'border-slate-700 bg-slate-800/60' : 'border-gray-200 bg-white'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{trip.vehicle}</p>
                        <p className={`text-xs ${muted}`}>{trip.route}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${muted}`}>
                          {new Date(trip.startTime).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenTrip(trip.id)}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                            dark
                              ? 'border-slate-600 text-slate-200 hover:bg-slate-700'
                              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {t('dashboard.plannedTrips.open')}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlannedTripsCalendar;
