import { FiCalendar, FiFileText, FiTool, FiTruck, FiUser } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Badge, Button, GlobalCard } from '../../../shared/components';
import type { ReclamationRecord, ReclamationStatus } from '../services/reclamations.service';

interface DriverIssueDetailsModalProps {
  issue: ReclamationRecord | null;
  isOpen: boolean;
  dark?: boolean;
  onClose: () => void;
  statusLabel: Record<ReclamationStatus, string>;
  getDriverLabel: (item: ReclamationRecord) => string;
  getVehicleLabel: (item: ReclamationRecord) => string;
  onScheduleMaintenance?: (item: ReclamationRecord) => void;
  onUpdateStatus?: (item: ReclamationRecord, status: ReclamationStatus) => void;
  isUpdatingStatus?: boolean;
}

const statusVariant: Record<ReclamationStatus, 'warning' | 'info' | 'success' | 'error'> = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
  REJECTED: 'error',
};

const formatDateTime = (value: string, locale: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale);
};

const formatIssueType = (value?: string) => {
  if (!value) return 'General';
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const DriverIssueDetailsModal = ({
  issue,
  isOpen,
  dark = false,
  onClose,
  statusLabel,
  getDriverLabel,
  getVehicleLabel,
  onScheduleMaintenance,
  onUpdateStatus,
  isUpdatingStatus = false,
}: DriverIssueDetailsModalProps) => {
  const { t, i18n } = useTranslation();

  if (!isOpen || !issue) return null;

  const panelClass = dark
    ? 'border-cyan-100/10 bg-slate-900/45'
    : 'border-slate-200 bg-slate-50/80';
  const cardClass = dark
    ? 'border-cyan-100/10 bg-slate-900/35'
    : 'border-slate-200 bg-white';
  const titleClass = dark ? 'text-white' : 'text-slate-950';
  const bodyClass = dark ? 'text-slate-300' : 'text-slate-700';
  const subtleClass = dark ? 'text-slate-500' : 'text-slate-400';
  const isMaintenanceIssue = String(issue.type || '').toLowerCase() === 'maintenance';
  const nextStatuses: ReclamationStatus[] = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

  return (
    <GlobalCard isOpen={isOpen} onClose={onClose} title={t('reclamations.details.title')} maxWidth="2xl">
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${subtleClass}`}>
              {t('common.subject')}
            </p>
            <h3 className={`mt-1 text-2xl font-black tracking-tight ${titleClass}`}>
              {issue.subject}
            </h3>
          </div>

          <Badge variant={statusVariant[issue.status]} size="sm">
            {statusLabel[issue.status]}
          </Badge>
        </div>

        <section className={`rounded-[18px] border p-4 ${panelClass}`}>
          <div className="mb-2 flex items-center gap-2">
            <FiFileText className={dark ? 'text-slate-400' : 'text-slate-500'} />
            <p className={`text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
              {t('common.description')}
            </p>
          </div>
          <p className={`whitespace-pre-wrap text-sm leading-6 ${bodyClass}`}>{issue.message}</p>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className={`rounded-[18px] border p-4 ${cardClass}`}>
            <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${subtleClass}`}>
              {t('common.status')}
            </p>
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => onUpdateStatus?.(issue, status)}
                  disabled={isUpdatingStatus || status === issue.status}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    status === issue.status
                      ? dark
                        ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100'
                        : 'border-cyan-200 bg-cyan-50 text-cyan-700'
                      : dark
                        ? 'border-slate-700 bg-slate-800/70 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {statusLabel[status]}
                </button>
              ))}
            </div>
          </div>

          <div className={`rounded-[18px] border p-4 ${cardClass}`}>
            <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${subtleClass}`}>
              {t('common.type')}
            </p>
            <p className={`flex items-center gap-2 text-sm font-medium ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
              <FiTool className={dark ? 'text-slate-500' : 'text-slate-500'} />
              {formatIssueType(issue.type)}
            </p>
          </div>

          <div className={`rounded-[18px] border p-4 ${cardClass}`}>
            <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${subtleClass}`}>
              {t('common.driver')}
            </p>
            <p className={`flex items-center gap-2 text-sm font-medium ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
              <FiUser className={dark ? 'text-slate-500' : 'text-slate-500'} />
              {getDriverLabel(issue)}
            </p>
          </div>

          <div className={`rounded-[18px] border p-4 ${cardClass}`}>
            <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${subtleClass}`}>
              {t('common.vehicle')}
            </p>
            <p className={`flex items-center gap-2 text-sm font-medium ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
              <FiTruck className={dark ? 'text-slate-500' : 'text-slate-500'} />
              {getVehicleLabel(issue)}
            </p>
          </div>

          <div className={`rounded-[18px] border p-4 ${cardClass}`}>
            <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${subtleClass}`}>
              {t('common.created')}
            </p>
            <p className={`flex items-center gap-2 text-sm ${bodyClass}`}>
              <FiCalendar className={dark ? 'text-slate-500' : 'text-slate-500'} />
              {formatDateTime(issue.createdAt, i18n.language)}
            </p>
          </div>

          <div className={`rounded-[18px] border p-4 ${cardClass}`}>
            <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${subtleClass}`}>
              {t('common.updated')}
            </p>
            <p className={`flex items-center gap-2 text-sm ${bodyClass}`}>
              <FiCalendar className={dark ? 'text-slate-500' : 'text-slate-500'} />
              {formatDateTime(issue.updatedAt, i18n.language)}
            </p>
          </div>
        </section>

        {(issue.images?.length ?? 0) > 0 ? (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className={`text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
                {t('reclamations.details.attachments')}
              </p>
              <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                {t('reclamations.details.files', { count: issue.images?.length ?? 0 })}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {issue.images?.map((image, index) => (
                <a
                  key={`${issue.id}-img-${index}`}
                  href={image}
                  target="_blank"
                  rel="noreferrer"
                  className={`group relative block overflow-hidden rounded-[18px] border ${
                    dark ? 'border-cyan-100/10' : 'border-slate-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={t('reclamations.details.attachmentAlt', { index: index + 1 })}
                    className="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/45 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-slate-900">
                      {t('reclamations.details.openPreview')}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
          {isMaintenanceIssue && onScheduleMaintenance ? (
            <Button
              type="button"
              onClick={() => onScheduleMaintenance(issue)}
              className="inline-flex items-center justify-center gap-2"
            >
              <FiTool />
              {t('maintenance.add')}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className={dark ? 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700' : ''}
          >
            {t('common.close')}
          </Button>
        </div>
      </div>
    </GlobalCard>
  );
};

export default DriverIssueDetailsModal;