import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, GlobalCard } from '../../../shared/components';
import type { Vehicle } from '../../../types';
import type { VehicleAssignmentSummary } from '../hooks/useVehicles';

interface MaintenanceRecommendation {
  overview: string;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface VehicleDetailsModalProps {
  isOpen: boolean;
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

const sectionTitleClass = 'text-sm font-semibold text-slate-900';

const prettyDate = (value: string | undefined, locale: string, fallback: string): string => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(locale);
};

const VehicleDetailsModal = ({
  isOpen,
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

  useEffect(() => {
    if (!isOpen) {
      setLiveRecommendations(null);
      setIsGenerating(false);
    }
  }, [isOpen]);

  const displayedRecommendations: MaintenanceRecommendation[] =
    liveRecommendations ??
    ((vehicle?.maintenance_recommandation_ai as { recommendations?: MaintenanceRecommendation[] } | null | undefined)
      ?.recommendations ?? []);

  const handleGenerateRecommendations = async () => {
    if (!vehicle) return;

    setIsGenerating(true);
    try {
      const fresh = await onGenerateRecommendations(vehicle.id);
      setLiveRecommendations(fresh);
      await onRecommendationsGenerated?.();
    } catch (generationError) {
      console.error('Failed to generate recommendations:', generationError);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <GlobalCard
      isOpen={isOpen}
      onClose={onClose}
      title={t('vehicles.details.title')}
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose} aria-label={t('vehicles.details.closeAria')}>
            {t('common.close')}
          </Button>
          <Button onClick={onEdit} disabled={!vehicle || isLoading} aria-label={t('vehicles.details.editAria')}>
            {t('common.edit')}
          </Button>
        </div>
      }
    >
      {isLoading && <p className="text-sm text-slate-500">{t('vehicles.details.loading')}</p>}

      {error && !isLoading && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {!isLoading && !error && vehicle && (
        <div className="space-y-6">
          <section className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">{t('common.name')}</p>
              <p className="text-sm font-semibold text-slate-900">{vehicle.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t('vehicles.details.vehicleId')}</p>
              <p className="text-sm font-semibold text-slate-900">{vehicle.id}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t('common.plate')}</p>
              <p className="text-sm font-semibold text-slate-900">{vehicle.plaque_immatriculation || t('common.na')}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t('common.model')}</p>
              <p className="text-sm font-semibold text-slate-900">{vehicle.Vehicle_Model}</p>
            </div>
          </section>

          <section>
            <h3 className={sectionTitleClass}>{t('vehicles.details.assignmentTitle')}</h3>
            {assignment ? (
              <div className="mt-2 rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-700">
                  {t('vehicles.details.assignmentDriver')}{' '}
                  <span className="font-semibold text-slate-900">{assignment.driverName ?? t('common.unassigned')}</span>
                </p>
                <p className="text-sm text-slate-700">
                  {t('vehicles.details.assignmentRoute')}{' '}
                  <span className="font-semibold text-slate-900">{assignment.startLocation} {'->'} {assignment.endLocation}</span>
                </p>
                <p className="text-sm text-slate-700">
                  {t('vehicles.details.assignmentStatus')}{' '}
                  <span className="font-semibold capitalize text-slate-900">
                    {assignment.tripStatus ? t(`trips.status.${assignment.tripStatus}`) : t('common.na')}
                  </span>
                </p>
                <p className="text-sm text-slate-700">
                  {t('vehicles.details.assignmentStart')}{' '}
                  <span className="font-semibold text-slate-900">{prettyDate(assignment.startTime, i18n.language, t('common.na'))}</span>
                </p>
              </div>
            ) : (
              <p className="mt-2 rounded-xl border border-slate-200 p-4 text-sm text-slate-500">{t('vehicles.details.noAssignment')}</p>
            )}
          </section>

          <section>
            <h3 className={sectionTitleClass}>{t('vehicles.details.maintenanceHistoryTitle')}</h3>
            {maintenanceHistory.length === 0 ? (
              <p className="mt-2 rounded-xl border border-slate-200 p-4 text-sm text-slate-500">{t('vehicles.details.noMaintenance')}</p>
            ) : (
              <div className="mt-2 space-y-2">
                {maintenanceHistory.slice(0, 6).map((record) => (
                  <div key={record.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-900">{record.description || t('common.maintenanceTask')}</p>
                    <p className="text-xs text-slate-500">
                      {t('vehicles.details.maintenanceLine', {
                        date: prettyDate(record.scheduledDate, i18n.language, t('common.na')),
                        status: record.status,
                        priority: record.priority,
                      })}
                    </p>
                    <p className="text-xs text-slate-500">
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
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('vehicles.details.recommendationsTitle')}</h3>
              <button
                onClick={handleGenerateRecommendations}
                disabled={isGenerating || !vehicle}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-medium text-white transition-colors"
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
              <p className="text-xs text-slate-400 italic">{t('common.noRecommendationsYet')}</p>
            ) : (
              <div className="space-y-2">
                {displayedRecommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`rounded-xl border px-4 py-3 ${
                      rec.level === 'HIGH'
                        ? 'border-rose-200 bg-rose-50 dark:border-rose-800/40 dark:bg-rose-950/30'
                        : rec.level === 'MEDIUM'
                        ? 'border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/30'
                        : 'border-blue-200 bg-blue-50 dark:border-blue-800/40 dark:bg-blue-950/30'
                    }`}
                  >
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${
                      rec.level === 'HIGH' ? 'text-rose-600 dark:text-rose-400'
                      : rec.level === 'MEDIUM' ? 'text-amber-600 dark:text-amber-400'
                      : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {rec.level}
                    </span>
                    <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      {rec.overview}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      )}
    </GlobalCard>
  );
};

export default VehicleDetailsModal;
