import { memo, useState } from "react";
import type { Vehicle } from "../../../types";
import { useTranslation } from "react-i18next";
import type { VehicleTableRow } from "../hooks/useVehicles";
import { AppDataTable, AppStatusBadge, AppTd, AppTr } from '../../../shared/components';
import { TranslatedText } from '../../../shared/components/TranslatedText';
import RowActions from "./RowActions";

interface VehiclesTableProps {
  rows: VehicleTableRow[];
  isLoading: boolean;
  error?: string | null;
  dark?: boolean;
  onView: (vehicleId: string) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicleId: string) => void;
}

const statusVariant = (status: VehicleTableRow["statusLabel"]) => {
  if (status === "Available") return "success";
  if (status === "In Use") return "info";
  if (status === "Maintenance") return "danger";
  return "neutral";
};

const levelStyle = (level: VehicleTableRow['maintenanceRecommendations'][number]['level']) => {
  switch (level) {
    case 'HIGH':   return 'text-rose-600 dark:text-rose-400';
    case 'MEDIUM': return 'text-amber-600 dark:text-amber-400';
    case 'LOW':    return 'text-blue-600 dark:text-blue-400';
    default:       return 'text-slate-500 dark:text-slate-400';
  }
};

const priorityVariant = (level: VehicleTableRow['maintenanceRecommendations'][number]['level']) => {
  switch (level) {
    case 'HIGH':
      return 'danger';
    case 'MEDIUM':
      return 'warning';
    case 'LOW':
      return 'success';
    default:
      return 'neutral';
  }
};

const VehiclesTable = memo(
  ({
    rows,
    isLoading,
    error,
    dark = false,
    onView,
    onEdit,
    onDelete,
  }: VehiclesTableProps) => {
    const { t } = useTranslation();
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const normalizeStatusKey = (value: string) => value.toLowerCase().replace(/\s+/g, '_').replace(/-+/g, '_');
    const translatePriority = (value: VehicleTableRow['maintenanceRecommendations'][number]['level']) => {
      const key = value.toLowerCase();
      return ['high', 'medium', 'low'].includes(key) ? t(`priority.${key}`) : value;
    };

    const toggleRow = (vehicleId: string) => {
      setExpandedRows((current) => ({
        ...current,
        [vehicleId]: !current[vehicleId],
      }));
    };

    if (isLoading) {
      return (
        <div
          className={`rounded-2xl border px-6 py-14 text-center text-sm ${
            dark
              ? "border-slate-700 text-slate-400"
              : "border-slate-200 text-slate-500"
          }`}
        >
          {t('vehicles.table.loading')}
        </div>
      );
    }

    if (error) {
      return (
        <div
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          role="alert"
        >
          {error}
        </div>
      );
    }

    if (rows.length === 0) {
      return (
        <div
          className={`rounded-2xl border px-6 py-14 text-center text-sm ${
            dark
              ? "border-slate-700 text-slate-400"
              : "border-slate-200 text-slate-500"
          }`}
        >
          {t('vehicles.table.empty')}
        </div>
      );
    }

    return (
      <AppDataTable
        columns={[
          t('vehicles.table.vehicle'),
          t('vehicles.table.status'),
          t('vehicles.table.driver'),
          t('vehicles.table.last_trip'),
          t('vehicles.table.maintenance_recommendation'),
          t('vehicles.table.actions'),
        ]}
        totalResults={rows.length}
        dark={dark}
        ariaLabel={t('vehicles.table.dataTableAria')}
        title={t('vehicles.title')}
      >
        {rows.map((row) => {
          const vehicleImage = row.vehicle.photos?.[0] ?? null;
          const recommendations = row.maintenanceRecommendations;
          const primaryRecommendation = recommendations[0] ?? null;
          const hasMoreRecommendations = recommendations.length > 1;
          const isExpanded = Boolean(expandedRows[row.vehicle.id]);

          return (
            <AppTr key={row.vehicle.id}>

              {/* ── Vehicle ── */}
              <AppTd className={dark ? 'text-slate-100' : 'text-slate-900'}>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-14 shrink-0 items-center justify-center rounded-md border text-slate-500 ${
                      dark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-100'
                    }`}
                  >
                    {vehicleImage ? (
                      <img
                        src={vehicleImage}
                        alt={row.vehicle.name}
                        className="h-full w-full rounded-md object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.setAttribute("aria-hidden", "true");
                        }}
                      />
                    ) : (
                      <span className={`text-[10px] font-medium ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {t('vehicles.table.noImage')}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className={`font-semibold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {row.vehicle.name}
                    </p>
                    <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {row.vehicle.plaque_immatriculation || row.vehicle.id}
                    </p>
                  </div>
                </div>
              </AppTd>

              {/* ── Status ── */}
              <AppTd>
                <AppStatusBadge variant={statusVariant(row.statusLabel)}>
                  {t(`status.${normalizeStatusKey(row.statusLabel)}`)}
                </AppStatusBadge>
              </AppTd>

              {/* ── Driver ── */}
              <AppTd
                className={
                  row.driverName === "Unassigned"
                    ? dark ? 'italic text-slate-400' : 'italic text-slate-500'
                    : dark ? 'text-slate-100' : 'text-slate-900'
                }
              >
                {row.driverName === 'Unassigned' ? t('common.unassigned') : row.driverName}
              </AppTd>

              {/* ── Last Trip ── */}
              <AppTd className={dark ? 'text-slate-300' : 'text-slate-500'}>
                {row.lastTripLabel === 'no_trips' ? t('common.no_trips') : row.lastTripLabel}
              </AppTd>

              {/* ── Maintenance ── */}
              <AppTd className="min-w-[18rem] align-top">
                {primaryRecommendation === null ? (
                  <span className={`text-xs italic ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {t('vehicles.table.noRecommendations')}
                  </span>
                ) : (
                  <div className="space-y-2 max-w-sm">
                    <div className="flex flex-wrap items-start gap-2">
                      <AppStatusBadge variant={priorityVariant(primaryRecommendation.level)}>
                        {translatePriority(primaryRecommendation.level)}
                      </AppStatusBadge>
                      {primaryRecommendation.component && (
                        <TranslatedText
                          as="span"
                          text={primaryRecommendation.component.replace(/_/g, ' ')}
                          className={`self-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            dark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'
                          }`}
                        />
                      )}
                      <TranslatedText
                        as="p"
                        text={primaryRecommendation.overview}
                        className={`min-w-0 flex-1 text-xs leading-relaxed line-clamp-2 ${levelStyle(primaryRecommendation.level)}`}
                      />
                    </div>

                    {hasMoreRecommendations && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => toggleRow(row.vehicle.id)}
                          aria-expanded={isExpanded}
                          aria-label={
                            isExpanded
                              ? t('vehicles.table.hideRecAria', { name: row.vehicle.name })
                              : t('vehicles.table.showRecAria', { name: row.vehicle.name })
                          }
                          className={`text-xs font-medium transition-colors ${
                            dark
                              ? 'text-slate-400 hover:text-slate-200'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {isExpanded
                            ? t('vehicles.table.hide')
                            : t('vehicles.table.showMore', { n: recommendations.length - 1 })}
                        </button>

                        {isExpanded && (
                          <div className={`space-y-2 rounded-xl border px-3 py-2 ${dark ? 'border-slate-700 bg-slate-800/60' : 'border-slate-200 bg-slate-50'}`}>
                            {recommendations.slice(1).map((rec, index) => (
                              <div key={`${row.vehicle.id}-rec-${index}`} className="flex flex-wrap items-start gap-2">
                                <AppStatusBadge variant={priorityVariant(rec.level)}>
                                  {translatePriority(rec.level)}
                                </AppStatusBadge>
                                {rec.component && (
                                  <TranslatedText
                                    as="span"
                                    text={rec.component.replace(/_/g, ' ')}
                                    className={`self-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                      dark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'
                                    }`}
                                  />
                                )}
                                <TranslatedText
                                  as="p"
                                  text={rec.overview}
                                  className={`min-w-0 flex-1 text-xs leading-relaxed line-clamp-2 ${levelStyle(rec.level)}`}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </AppTd>

              {/* ── Actions ── */}
              <AppTd>
                <RowActions
                  onView={() => onView(row.vehicle.id)}
                  onEdit={() => onEdit(row.vehicle)}
                  onDelete={() => onDelete(row.vehicle.id)}
                />
              </AppTd>

            </AppTr>
          );
        })}
      </AppDataTable>
    );
  },
);

VehiclesTable.displayName = "VehiclesTable";

export default VehiclesTable;
