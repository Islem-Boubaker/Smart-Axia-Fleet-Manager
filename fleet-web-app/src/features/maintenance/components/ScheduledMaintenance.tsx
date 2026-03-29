import { FiCalendar, FiClock, FiTruck } from 'react-icons/fi';

export interface ScheduledItem {
  id: string;
  vehicle: string;
  plate: string;
  type: string;
  scheduledFor: string;
  window: string;
}

const UPCOMING: ScheduledItem[] = [
  {
    id: '1',
    vehicle: 'Toyota Camry',
    plate: '123 TU 4567',
    type: 'Oil & filter',
    scheduledFor: '2026-04-02',
    window: '09:00 – 11:00',
  },
  {
    id: '2',
    vehicle: 'Ford Transit',
    plate: '234 TU 8912',
    type: 'Brake inspection',
    scheduledFor: '2026-04-04',
    window: '14:00 – 16:00',
  },
  {
    id: '3',
    vehicle: 'Tesla Model 3',
    plate: '189 TU 6754',
    type: 'Tire rotation',
    scheduledFor: '2026-04-08',
    window: '10:30 – 12:00',
  },
];

interface Props {
  dark?: boolean;
}

export function ScheduledMaintenance({ dark = false }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
            Upcoming
          </p>
          <h2 className={`text-xl font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>Scheduled maintenance</h2>
          <p className={`text-sm mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            Next service windows for your fleet
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
        {UPCOMING.map((item, i) => (
          <li
            key={item.id}
            className={`rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-soft ${
              dark
                ? 'border-slate-700/80 bg-slate-800/40'
                : 'border-slate-200/90 bg-white/80 shadow-glass'
            } ${i % 2 === 1 ? 'xl:mt-2' : ''}`}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                  dark ? 'bg-brand/20 text-brand' : 'bg-brand-light text-brand-deep'
                }`}
              >
                <FiTruck className="w-5 h-5" />
              </div>
              <span
                className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                  dark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-800'
                }`}
              >
                Scheduled
              </span>
            </div>
            <h3 className={`font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{item.vehicle}</h3>
            <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{item.plate}</p>
            <p className={`text-sm font-medium mt-3 ${dark ? 'text-slate-200' : 'text-slate-800'}`}>{item.type}</p>
            <div className={`mt-4 flex flex-wrap gap-4 text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="inline-flex items-center gap-1.5">
                <FiCalendar className="w-4 h-4 opacity-80" />
                {item.scheduledFor}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FiClock className="w-4 h-4 opacity-80" />
                {item.window}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
