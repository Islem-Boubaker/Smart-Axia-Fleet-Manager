import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, GlobalCard } from '../../../shared/components';
import type { Vehicle } from '../../../types';
import type { VehicleAssignmentSummary, MaintenanceRecommendation, MaintenanceFlag } from '../hooks/useVehicles';
import { parseMaintenanceFlags, parseMaintenanceRecommendation } from '../hooks/useVehicles';

interface VehicleDetailsModalProps {
  isOpen: boolean;
  dark?: boolean;
  onClose: () => void;
  onEdit: () => void;
  onGenerateRecommendations: (vehicleId: string) => Promise<MaintenanceRecommendation[]>;
  onRecommendationsGenerated?: () => Promise<void> | void;
  vehicle: Vehicle | null;
  assignment: VehicleAssignmentSummary | null;
  maintenanceHistory: Array<{
    id: string;
    scheduledDate: string;
    status: string;
    priority: string;
    cost: number;
    description?: string;
  }>;
  isLoading?: boolean;
  error?: string | null;
}

const prettyDate = (value: string | undefined, locale: string, fallback: string): string => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(locale);
};

const VehicleDetailsModal = ({
  isOpen,
  dark = false,
  onClose,
  onEdit,
  onGenerateRecommendations,
  onRecommendationsGenerated,
  vehicle,
  assignment,
  maintenanceHistory,
  isLoading = false,
  error = null,
}: VehicleDetailsModalProps) => {
  const { t, i18n } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [liveRecommendations, setLiveRecommendations] = useState<MaintenanceRecommendation[] | null>(null);
  const [liveFlags, setLiveFlags] = useState<MaintenanceFlag[] | null>(null);

  // Reset live state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setLiveRecommendations(null);
      setLiveFlags(null);
      setIsGenerating(false);
    }
  }, [isOpen]);

  const displayedRecommendations: MaintenanceRecommendation[] =
    liveRecommendations ?? (vehicle ? parseMaintenanceRecommendation(vehicle) : []);

  const displayedFlags: MaintenanceFlag[] =
    liveFlags ?? (vehicle ? parseMaintenanceFlags(vehicle) : []);

  const handleGenerateRecommendations = async () => {
    if (!vehicle) return;

    setIsGenerating(true);
    try {
      const fresh = await onGenerateRecommendations(vehicle.id);
      setLiveRecommendations(fresh);
      setLiveFlags(null);
      await onRecommendationsGenerated?.();
    } catch (generationError) {
      console.error('Failed to generate recommendations:', generationError);
    } finally {
      setIsGenerating(false);
    }
  };

  const sectionTitleClass = dark
    ? 'text-sm font-bold text-slate-50'
    : 'text-sm font-semibold text-slate-900';
  const summaryPanelClass = dark
    ? 'relative grid grid-cols-1 gap-4 overflow-hidden rounded-[22px] border border-sky-300/14 bg-[#0e2136] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_18px_50px_rgba(0,0,0,0.24)] sm:grid-cols-2'
    : 'grid grid-cols-1 gap-3 rounded-[20px] border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2';
  const detailPanelClass = dark
    ? 'mt-2 rounded-[20px] border border-cyan-200/12 bg-[#0f1d31]/82 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
    : 'mt-2 rounded-[18px] border border-slate-200 bg-white p-4';
  const detailLabelClass = dark
    ? 'text-xs font-bold uppercase tracking-[0.14em] text-cyan-100/60'
    : 'text-xs font-semibold uppercase tracking-wide text-slate-500';
  const detailValueClass = dark
    ? 'text-sm font-bold text-white'
    : 'text-sm font-semibold text-slate-900';
  const identityItemClass = dark
    ? 'relative z-10 rounded-2xl border border-sky-200/10 bg-[#132b43] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]'
    : '';
  const detailTextClass = dark ? 'text-sm text-slate-300' : 'text-sm text-slate-700';
  const detailStrongClass = dark ? 'font-bold text-white' : 'font-semibold text-slate-900';
  const mutedPanelClass = dark
    ? 'mt-2 rounded-[20px] border border-cyan-200/12 bg-[#0f1d31]/72 p-4 text-sm text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
    : 'mt-2 rounded-[18px] border border-slate-200 bg-white/80 p-4 text-sm text-slate-500';
  const maintenanceCardClass = dark
    ? 'rounded-[18px] border border-cyan-200/12 bg-[#0f1d31]/78 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
    : 'rounded-[16px] border border-slate-200 bg-white p-3';
  const secondaryButtonClass = dark
    ? 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
    : '';
  const primaryButtonClass = dark
    ? '!bg-none !bg-cyan-400 text-slate-950 hover:!bg-cyan-300'
    : '';
  const generateButtonClass = dark
    ? 'flex items-center gap-1.5 rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-[0_10px_24px_rgba(34,211,238,0.18)] transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60'
    : 'flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60';
  const recommendationTextClass = dark
    ? 'mt-1 text-xs leading-relaxed text-slate-300'
    : 'mt-1 text-xs leading-relaxed text-slate-700';
  const flagSeverityClass = (severity: MaintenanceFlag['severity']) => {
    if (dark) {
      if (severity === 'HIGH') return 'border-rose-400/20 bg-rose-950/25 text-rose-300';
      if (severity === 'MEDIUM') return 'border-amber-300/20 bg-amber-950/20 text-amber-300';
      return 'border-cyan-300/20 bg-cyan-950/20 text-cyan-300';
    }
    if (severity === 'HIGH') return 'border-rose-200 bg-rose-50 text-rose-600';
    if (severity === 'MEDIUM') return 'border-amber-200 bg-amber-50 text-amber-600';
    return 'border-blue-200 bg-blue-50 text-blue-600';
  };

  const recommendationCardClass = (level: MaintenanceRecommendation['level']) => {
    if (dark) {
      if (level === 'HIGH') return 'rounded-xl border border-rose-400/25 bg-rose-950/30 px-4 py-3';
      if (level === 'MEDIUM') return 'rounded-xl border border-amber-300/25 bg-amber-950/25 px-4 py-3';
      return 'rounded-xl border border-cyan-300/20 bg-cyan-950/22 px-4 py-3';
    }

    if (level === 'HIGH') return 'rounded-xl border border-rose-200 bg-rose-50 px-4 py-3';
    if (level === 'MEDIUM') return 'rounded-xl border border-amber-200 bg-amber-50 px-4 py-3';
    return 'rounded-xl border border-blue-200 bg-blue-50 px-4 py-3';
  };
  const recommendationLevelClass = (level: MaintenanceRecommendation['level']) => {
    if (dark) {
      if (level === 'HIGH') return 'text-rose-300';
      if (level === 'MEDIUM') return 'text-amber-300';
      return 'text-cyan-300';
    }

    if (level === 'HIGH') return 'text-rose-600';
    if (level === 'MEDIUM') return 'text-amber-600';
    return 'text-blue-600';
  };

  return (
    <GlobalCard
      isOpen={isOpen}
      onClose={onClose}
      title={t('vehicles.details.title')}
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
            aria-label={t('vehicles.details.closeAria')}
            className={secondaryButtonClass}
          >
            {t('common.close')}
          </Button>
          <Button
            onClick={onEdit}
            disabled={!vehicle || isLoading}
            aria-label={t('vehicles.details.editAria')}
            className={primaryButtonClass}
          >
            {t('common.edit')}
          </Button>
        </div>
      }
    >
      {isLoading && <p className={dark ? 'text-sm text-slate-400' : 'text-sm text-slate-500'}>{t('vehicles.details.loading')}</p>}

      {error && !isLoading && (
        <div className={dark ? 'rounded-xl border border-rose-500/25 bg-rose-950/35 px-4 py-3 text-sm text-rose-200' : 'rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'}>{error}</div>
      )}

      {!isLoading && !error && vehicle && (
        <div className="space-y-5">
          <section className={summaryPanelClass}>
            {dark ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-cyan-300/16 blur-3xl"
              />
            ) : null}
            <div className={identityItemClass}>
              <p className={detailLabelClass}>{t('common.name')}</p>
              <p className={detailValueClass}>{vehicle.name}</p>
            </div>
            <div className={identityItemClass}>
              <p className={detailLabelClass}>{t('common.plate')}</p>
              <p className={detailValueClass}>{vehicle.plaque_immatriculation || t('common.na')}</p>
            </div>
            <div className={identityItemClass}>
              <p className={detailLabelClass}>{t('common.model')}</p>
              <p className={detailValueClass}>{vehicle.Vehicle_Model}</p>
            </div>
          </section>

          <section>
            <h3 className={sectionTitleClass}>{t('vehicles.details.assignmentTitle')}</h3>
            {assignment ? (
              <div className={detailPanelClass}>
                <p className={detailTextClass}>
                  {t('vehicles.details.assignmentDriver')} <span className={detailStrongClass}>{assignment.driverName}</span>
                </p>
                <p className={detailTextClass}>
                  {t('vehicles.details.assignmentRoute')} <span className={detailStrongClass}>{assignment.startLocation} {'->'} {assignment.endLocation}</span>
                </p>
                <p className={detailTextClass}>
                  {t('vehicles.details.assignmentStatus')} <span className={`capitalize ${detailStrongClass}`}>{t(`status.${String(assignment.tripStatus || '').toLowerCase().replace(/\s+/g, '_')}`)}</span>
                </p>
                <p className={detailTextClass}>
                  {t('vehicles.details.assignmentStart')} <span className={detailStrongClass}>{prettyDate(assignment.startTime, i18n.language, t('common.na'))}</span>
                </p>
              </div>
            ) : (
              <p className={mutedPanelClass}>{t('vehicles.details.noAssignment')}</p>
            )}
          </section>

          <section>
            <h3 className={sectionTitleClass}>{t('vehicles.details.maintenanceHistoryTitle')}</h3>
            {maintenanceHistory.length === 0 ? (
              <p className={mutedPanelClass}>{t('vehicles.details.noMaintenance')}</p>
            ) : (
              <div className="mt-2 space-y-2">
                {maintenanceHistory.slice(0, 6).map((record) => (
                  <div key={record.id} className={maintenanceCardClass}>
                    <p className={dark ? 'text-sm font-bold text-white' : 'text-sm font-semibold text-slate-900'}>{record.description || t('common.maintenanceTask')}</p>
                    <p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>
                      {t('vehicles.details.maintenanceLine', {
                        date: prettyDate(record.scheduledDate, i18n.language, t('common.na')),
                        status: t(`status.${String(record.status || '').toLowerCase().replace(/\s+/g, '_')}`),
                        priority: t(`priority.${String(record.priority || '').toLowerCase()}`),
                      })}
                    </p>
                    <p className={dark ? 'text-xs text-slate-400' : 'text-xs text-slate-500'}>
                      {t('vehicles.details.costLine', {
                        cost: record.cost.toLocaleString(i18n.language),
                        currency: t('common.currencyDzd'),
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className={sectionTitleClass}>
                {t('vehicles.details.recommendationsHeading')}
              </h3>
              <button
                onClick={handleGenerateRecommendations}
                disabled={isGenerating || !vehicle}
                className={generateButtonClass}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    {t('vehicles.details.generating')}
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {displayedRecommendations.length > 0 ? t('vehicles.details.regenerate') : t('vehicles.details.generate')}
                  </>
                )}
              </button>
            </div>

            {displayedRecommendations.length === 0 ? (
              <p className={dark ? 'text-xs italic text-slate-500' : 'text-xs italic text-slate-400'}>{t('common.noRecommendationsYet')}</p>
            ) : (
              <div className="space-y-3">
                {displayedRecommendations.map((rec, index) => (
                  <div key={index} className={recommendationCardClass(rec.level)}>
                    {/* Level + component */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${recommendationLevelClass(rec.level)}`}>
                        {rec.level}
                      </span>
                      {rec.component && (
                        <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                          dark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {rec.component.replace(/_/g, ' ')}
                        </span>
                      )}
                      {typeof rec.estimated_urgency_days === 'number' && (
                        <span className={`ml-auto text-[10px] font-semibold ${
                          rec.estimated_urgency_days === 0
                            ? dark ? 'text-rose-300' : 'text-rose-600'
                            : dark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {rec.estimated_urgency_days === 0
                            ? t('vehicles.details.urgencyNow', 'Act now')
                            : t('vehicles.details.urgencyDays', { days: rec.estimated_urgency_days, defaultValue: `Within ${rec.estimated_urgency_days}d` })}
                        </span>
                      )}
                    </div>
                    {/* Action */}
                    <p className={`${recommendationTextClass} font-medium`}>
                      {rec.overview}
                    </p>
                    {/* Justification */}
                    {rec.justification && (
                      <p className={`mt-1 text-[11px] italic ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {rec.justification}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Detected flags sub-section */}
            {displayedFlags.length > 0 && (
              <div className="mt-4">
                <p className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('vehicles.details.detectedFlags', 'Detected issues')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {displayedFlags.map((flag, i) => (
                    <span
                      key={i}
                      title={flag.note}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${flagSeverityClass(flag.severity)}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                      {flag.component.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

        </div>
      )}
    </GlobalCard>
  );
};

export default VehicleDetailsModal;
