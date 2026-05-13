import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMail, FiPhone, FiEdit2, FiTrash2, FiUser } from 'react-icons/fi';
import { Badge } from '../../../shared/components';
import { TranslatedText } from '../../../shared/components/TranslatedText';

interface DriverCardProps {
  driver: any;
  onEdit?: (driver: any) => void;
  onDelete?: (id: string) => void;
  dark?: boolean;
}

const DriverCard = memo(({ driver, onEdit, onDelete, dark = false }: DriverCardProps) => {
  const { t } = useTranslation();
  const textClass = dark ? 'text-slate-100' : 'text-gray-900';
  const sub = dark ? 'text-slate-400' : 'text-gray-600';
  const border = dark ? 'border-slate-700' : 'border-gray-200';
  const normalizedStatus = String(driver.status || '').toLowerCase();
  const assignedVehicle = String(driver.assignedVehicle || '').trim();
  const assignedMatch = assignedVehicle.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  const assignedName = assignedMatch ? assignedMatch[1] : assignedVehicle || t('common.na');
  const assignedPlate = assignedMatch ? assignedMatch[2] : '';
  const normalizeStatusKey = (value: string) =>
    value.toLowerCase().replace(/\s+/g, '_').replace(/-+/g, '_');

  const statusVariant =
    normalizedStatus === 'active' ? 'success' : normalizedStatus === 'on-leave' ? 'warning' : 'default';

  const statusClass = dark
    ? normalizedStatus === 'active'
      ? 'bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-300/40'
      : normalizedStatus === 'on-leave'
        ? 'bg-amber-500/25 text-amber-200 ring-1 ring-amber-300/40'
        : 'bg-rose-500/20 text-rose-200 ring-1 ring-rose-300/35'
    : '';

  const statusLabel = (() => {
    return t(`status.${normalizeStatusKey(normalizedStatus)}`);
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${
              dark ? 'bg-brand/25 text-brand' : 'bg-brand text-white'
            }`}
          >
            {driver.avatar ? (
              <img src={driver.avatar} alt={driver.name} className="w-full h-full object-cover" />
            ) : (
              <FiUser className={`text-2xl ${dark ? '' : 'text-white'}`} />
            )}
          </div>
          <div className="min-w-0">
            <h3 className={`text-lg font-semibold truncate ${textClass}`}>{driver.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {driver.experienceBadge ? (
                <Badge variant="info" size="sm">
                  <TranslatedText text={driver.experienceBadge.label} />
                </Badge>
              ) : null}
              <span
                className={`inline-flex items-center px-2 py-1 rounded-lg text-sm font-medium ${
                  dark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-800'
                }`}
              >
                ⭐ {driver.rating || '4.8'}
              </span>
              {typeof driver.driverScore === 'number' ? (
                <span className={`inline-flex items-center px-2 py-1 rounded-lg text-sm font-medium ${
                  dark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-50 text-blue-800'
                }`}>
                  {driver.driverScore}/100
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <Badge variant={statusVariant} className={statusClass}>
          {statusLabel}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className={`flex items-center ${sub}`}>
          <FiMail className={`mr-2 shrink-0 ${dark ? 'text-slate-500' : 'text-gray-400'}`} />
          <span className="text-sm truncate">{driver.email}</span>
        </div>
        <div className={`flex items-center ${sub}`}>
          <FiPhone className={`mr-2 shrink-0 ${dark ? 'text-slate-500' : 'text-gray-400'}`} />
          <span className="text-sm">{driver.phone}</span>
        </div>
      </div>

      <div className={`pt-4 border-t ${border}`}>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="min-w-0">
            <span className={`block ${dark ? 'text-slate-500' : 'text-gray-500'}`}>{t('drivers.card.license')}</span>
            <span className={`block font-medium truncate ${textClass}`}>{driver.licenseNumber || t('drivers.table.noLicense')}</span>
          </div>
          <div className="min-w-0">
            <span className={`block ${dark ? 'text-slate-500' : 'text-gray-500'}`}>{t('drivers.card.expires')}</span>
            <span className={`block font-medium truncate ${textClass}`}>{driver.licenseExpiry || '2026-12-31'}</span>
          </div>
          <div className="min-w-0">
            <span className={`block ${dark ? 'text-slate-500' : 'text-gray-500'}`}>{t('drivers.card.totalTrips')}</span>
            <span className={`block font-medium truncate ${textClass}`}>{driver.totalTrips || '142'}</span>
          </div>
          <div className="min-w-0">
            <span className={`block ${dark ? 'text-slate-500' : 'text-gray-500'}`}>{t('drivers.card.vehicle')}</span>
            <span className={`block font-medium leading-snug break-words ${textClass}`}>{assignedName}</span>
            {assignedPlate && (
              <span className={`block text-xs mt-0.5 leading-snug break-words ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                {assignedPlate}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={`flex gap-2 border-t pt-4 ${border}`}>
        <button
          type="button"
          onClick={() => onEdit?.(driver)}
          className={`flex-1 px-3 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-medium ${
            dark
              ? 'bg-brand/15 text-brand hover:bg-brand/25'
              : 'bg-brand-light text-brand-deep hover:bg-brand-light/80'
          }`}
        >
          <FiEdit2 />
          {t('common.edit')}
        </button>
        <button
          type="button"
          onClick={() => onDelete?.(driver.id)}
          className={`flex-1 px-3 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-medium ${
            dark ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25' : 'bg-red-50 text-red-600 hover:bg-red-100'
          }`}
        >
          <FiTrash2 />
          {t('common.delete')}
        </button>
      </div>
    </div>
  );
});

DriverCard.displayName = 'DriverCard';

export default DriverCard;
