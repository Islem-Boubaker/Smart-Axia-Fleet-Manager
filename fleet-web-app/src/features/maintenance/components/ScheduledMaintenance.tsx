import { FiCalendar, FiClock, FiTruck } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import type { Maintenance } from '../../../types';

interface Props {
  dark?: boolean;
  items?: Maintenance[];
}

export function ScheduledMaintenance({ dark = false, items = [] }: Props) {
  const { t } = useTranslation();
  const normalizeKey = (value: string) => value.toLowerCase().replace(/\s+/g, '_').replace(/-+/g, '_');

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
            {t('maintenance.upcoming')}
          </p>
          <h2 className={`text-xl font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{t('maintenance.scheduledTitle')}</h2>
          <p className={`text-sm mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            {t('maintenance.scheduledSubtitle')}
          </p>
        </div>
      </div>

      {items.length === 0 && (
        <div className={`rounded-xl border px-4 py-8 text-sm text-center ${dark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
          {t('maintenance.noUpcoming')}
        </div>
      )}

      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
        {items.map((item, i) => (
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
                {t('status.scheduled')}
              </span>
            </div>
            <h3 className={`font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{item.vehiclePlate || t('common.vehicle')}</h3>
            <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{item.vehiclePlate}</p>
            <p className={`text-sm font-medium mt-3 ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
              {item.type ? t(`maintenance.types.${normalizeKey(item.type)}`, { defaultValue: item.type }) : t('maintenance.title')}
            </p>
            <div className={`mt-4 flex flex-wrap gap-4 text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="inline-flex items-center gap-1.5">
                <FiCalendar className="w-4 h-4 opacity-80" />
                {item.scheduledDate}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FiClock className="w-4 h-4 opacity-80" />
                {t(`status.${normalizeKey(item.status)}`, { defaultValue: item.status })}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
