import { Button, GlobalCard } from '../../../shared/components';
import type { Vehicle } from '../../../types';
import type { VehicleAssignmentSummary } from '../hooks/useVehicles';
import type { MaintenanceRecommendation } from './maintenanceStatic';

interface GroupedRecommendations {
  high: MaintenanceRecommendation[];
  medium: MaintenanceRecommendation[];
  low: MaintenanceRecommendation[];
}

interface VehicleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
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
  recommendations: GroupedRecommendations;
  isLoading?: boolean;
  error?: string | null;
}

const sectionTitleClass = 'text-sm font-semibold text-slate-900';

const priorityBadgeClass: Record<keyof GroupedRecommendations, string> = {
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700',
};

const prettyDate = (value?: string): string => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
};

const VehicleDetailsModal = ({
  isOpen,
  onClose,
  onEdit,
  vehicle,
  assignment,
  maintenanceHistory,
  recommendations,
  isLoading = false,
  error = null,
}: VehicleDetailsModalProps) => {
  return (
    <GlobalCard
      isOpen={isOpen}
      onClose={onClose}
      title="Vehicle details"
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose} aria-label="Close vehicle details">
            Close
          </Button>
          <Button onClick={onEdit} disabled={!vehicle || isLoading} aria-label="Edit this vehicle">
            Edit
          </Button>
        </div>
      }
    >
      {isLoading && <p className="text-sm text-slate-500">Loading vehicle details...</p>}

      {error && !isLoading && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {!isLoading && !error && vehicle && (
        <div className="space-y-6">
          <section className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">Name</p>
              <p className="text-sm font-semibold text-slate-900">{vehicle.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Vehicle ID</p>
              <p className="text-sm font-semibold text-slate-900">{vehicle.id}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Plate</p>
              <p className="text-sm font-semibold text-slate-900">{vehicle.plaque_immatriculation || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Model</p>
              <p className="text-sm font-semibold text-slate-900">{vehicle.Vehicle_Model}</p>
            </div>
          </section>

          <section>
            <h3 className={sectionTitleClass}>Current Assignment</h3>
            {assignment ? (
              <div className="mt-2 rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-700">
                  Driver: <span className="font-semibold text-slate-900">{assignment.driverName}</span>
                </p>
                <p className="text-sm text-slate-700">
                  Route: <span className="font-semibold text-slate-900">{assignment.startLocation} {'->'} {assignment.endLocation}</span>
                </p>
                <p className="text-sm text-slate-700">
                  Status: <span className="font-semibold capitalize text-slate-900">{assignment.tripStatus}</span>
                </p>
                <p className="text-sm text-slate-700">
                  Start: <span className="font-semibold text-slate-900">{prettyDate(assignment.startTime)}</span>
                </p>
              </div>
            ) : (
              <p className="mt-2 rounded-xl border border-slate-200 p-4 text-sm text-slate-500">No active assignment for this vehicle.</p>
            )}
          </section>

          <section>
            <h3 className={sectionTitleClass}>Maintenance History</h3>
            {maintenanceHistory.length === 0 ? (
              <p className="mt-2 rounded-xl border border-slate-200 p-4 text-sm text-slate-500">No maintenance records found.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {maintenanceHistory.slice(0, 6).map((record) => (
                  <div key={record.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-900">{record.description || 'Maintenance task'}</p>
                    <p className="text-xs text-slate-500">
                      {prettyDate(record.scheduledDate)} • {record.status} • Priority {record.priority}
                    </p>
                    <p className="text-xs text-slate-500">Cost: {record.cost.toLocaleString()} DZD</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className={sectionTitleClass}>Maintenance Recommendations</h3>
            <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
              {(['high', 'medium', 'low'] as const).map((priority) => (
                <div key={priority} className="rounded-xl border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${priorityBadgeClass[priority]}`}>
                      {priority}
                    </span>
                    <span className="text-xs text-slate-500">{recommendations[priority].length}</span>
                  </div>

                  {recommendations[priority].length === 0 ? (
                    <p className="text-xs text-slate-500">No recommendations.</p>
                  ) : (
                    <ul className="space-y-2">
                      {recommendations[priority].map((item) => (
                        <li key={`${priority}-${item.title}`} className="rounded-md bg-slate-50 p-2">
                          <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                          <p className="text-xs text-slate-500">{item.description}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </GlobalCard>
  );
};

export default VehicleDetailsModal;
