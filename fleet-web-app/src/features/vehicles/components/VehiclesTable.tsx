import { memo } from "react";
import type { Vehicle } from "../../../types";
import type { VehicleTableRow } from "../hooks/useVehicles";
import DataTable, { Td, Tr } from "./DataTable";
import RowActions from "./RowActions";
import StatusBadge from "./StatusBadge";
import { getVehicleRecommendations } from "./maintenanceStatic";

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
    if (isLoading) {
      return (
        <div
          className={`rounded-2xl border px-6 py-14 text-center text-sm ${
            dark
              ? "border-slate-700 text-slate-400"
              : "border-slate-200 text-slate-500"
          }`}
        >
          Loading vehicles...
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
          No vehicles found for the selected filters.
        </div>
      );
    }

    return (
      <DataTable
        columns={[
          "Vehicle",
          "Model",
          "Status",
          "Driver",
          "Last Trip",
          "Maintenance",
          "Actions",
        ]}
        totalResults={rows.length}
        dark={dark}
      >
        {rows.map((row) => {
          const vehicleImage = row.vehicle.photos?.[0] ?? null;
          const recommendations = getVehicleRecommendations(
            row.vehicle.plaque_immatriculation,
          );
          const priorityCounts = recommendations.reduce(
            (accumulator, recommendation) => {
              accumulator[recommendation.priority] += 1;
              return accumulator;
            },
            { high: 0, medium: 0, low: 0 },
          );

          return (
            <Tr key={row.vehicle.id}>
              <Td className={dark ? 'text-slate-100' : 'text-slate-900'}>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-14 items-center justify-center rounded-md border text-slate-500 ${
                      dark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-100'
                    }`}
                  >
                    {vehicleImage ? (
                      <img
                        src={vehicleImage}
                        alt={row.vehicle.name}
                        className="h-full w-full rounded-md object-cover"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                          event.currentTarget.setAttribute(
                            "aria-hidden",
                            "true",
                          );
                        }}
                      />
                    ) : (
                      <span className={`text-[10px] font-medium ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                        No image
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
              </Td>

              <Td className={dark ? 'text-slate-200' : 'text-slate-600'}>{row.vehicle.Vehicle_Model}</Td>

              <Td>
                <StatusBadge variant={statusVariant(row.statusLabel)}>
                  {row.statusLabel}
                </StatusBadge>
              </Td>

              <Td
                className={
                  row.driverName === "Unassigned"
                    ? dark
                      ? 'italic text-slate-400'
                      : 'italic text-slate-500'
                    : dark
                      ? 'text-slate-100'
                      : 'text-slate-900'
                }
              >
                {row.driverName}
              </Td>

              <Td className={dark ? 'text-slate-300' : 'text-slate-500'}>{row.lastTripLabel}</Td>
              <Td>
                {recommendations.length === 0 ? (
                  <span className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-400'}`}>
                    No recommendations
                  </span>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {priorityCounts.high > 0 && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                          High: {priorityCounts.high}
                        </span>
                      )}
                      {priorityCounts.medium > 0 && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          Medium: {priorityCounts.medium}
                        </span>
                      )}
                      {priorityCounts.low > 0 && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                          Low: {priorityCounts.low}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className={`text-xs font-medium ${
                        dark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                      }`}
                      onClick={() => onView(row.vehicle.id)}
                      aria-label={`View maintenance recommendations for ${row.vehicle.name}`}
                    >
                      View details
                    </button>
                  </div>
                )}
              </Td>
              <Td>
                <RowActions
                  onView={() => onView(row.vehicle.id)}
                  onEdit={() => onEdit(row.vehicle)}
                  onDelete={() => onDelete(row.vehicle.id)}
                />
              </Td>
            </Tr>
          );
        })}
      </DataTable>
    );
  },
);

VehiclesTable.displayName = "VehiclesTable";

export default VehiclesTable;
