import { memo } from 'react';
import { FiTruck, FiCalendar, FiTool, FiDollarSign } from 'react-icons/fi';
import { Badge } from '../../../shared/components';
import type { Maintenance } from '../../../types';

interface MaintenanceTableProps {
  data: Maintenance[];
  dark?: boolean;
  onUpdate?: () => void;
  onTransition?: (record: Maintenance) => Promise<void> | void;
  onEdit?: (record: Maintenance) => void;
  onRemove?: (record: Maintenance) => Promise<void> | void;
}

const MaintenanceTable = memo(({ data, dark = false, onUpdate, onTransition, onEdit, onRemove }: MaintenanceTableProps) => {
  const records = data ?? [];

  type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

  const getStatusColor = (status: string): BadgeVariant => {
    const normalized = String(status).replace(/_/g, '-');
    switch (normalized) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'info';
      case 'pending':
      case 'scheduled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string): BadgeVariant => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getActionLabel = (status: Maintenance['status']) => {
    if (status === 'scheduled' || status === 'pending') return 'Start maintenance';
    if (status === 'in_progress') return 'Complete maintenance';
    return 'No action';
  };

  const handleTransition = async (record: Maintenance) => {
    if (!onTransition) return;
    await onTransition(record);
    if (onUpdate) onUpdate();
  };

  const cardBase = dark
    ? 'border-slate-700/80 bg-slate-800/35 hover:border-slate-600'
    : 'border-slate-200/90 bg-white/80 shadow-glass hover:shadow-soft';

  const label = dark ? 'text-slate-500' : 'text-slate-500';
  const value = dark ? 'text-slate-100' : 'text-slate-900';
  const icon = dark ? 'text-slate-500' : 'text-slate-400';

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        {records.map((record: Maintenance) => (
          <div
            key={record.id}
            className={`rounded-2xl border p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 ${cardBase}`}
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
              <div className="flex-1 min-w-0">
                <h3 className={`text-lg font-semibold mb-2 ${value}`}>{record.type}</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={getStatusColor(record.status)}>{record.status}</Badge>
                  <Badge variant={getPriorityColor(record.priority)}>{record.priority} priority</Badge>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onEdit?.(record)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                    dark
                      ? 'text-brand bg-brand/15 hover:bg-brand/25'
                      : 'text-brand-deep bg-brand-light hover:bg-brand-light/80'
                  }`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onRemove?.(record)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                    dark
                      ? 'text-rose-300 bg-rose-500/15 hover:bg-rose-500/25'
                      : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                  }`}
                >
                  Remove
                </button>
                {(record.status === 'scheduled' || record.status === 'pending' || record.status === 'in_progress') && (
                  <button
                    type="button"
                    onClick={() => handleTransition(record)}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                      dark
                        ? 'text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    {getActionLabel(record.status)}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <FiTruck className={`shrink-0 ${icon}`} />
                <div className="min-w-0">
                  <p className={`text-xs ${label}`}>Vehicle</p>
                  <p className={`text-sm font-medium truncate ${value}`}>
                    {record.vehicleName
                      ? `${record.vehicleName}${record.vehiclePlate ? ` (${record.vehiclePlate})` : ''}`
                      : record.vehiclePlate || '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <FiCalendar className={`shrink-0 ${icon}`} />
                <div className="min-w-0">
                  <p className={`text-xs ${label}`}>Scheduled date</p>
                  <p className={`text-sm font-medium ${value}`}>{record.scheduledDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <FiTool className={`shrink-0 ${icon}`} />
                <div className="min-w-0">
                  <p className={`text-xs ${label}`}>Technician</p>
                  <p className={`text-sm font-medium truncate ${value}`}>{record.technician || 'TBD'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <FiDollarSign className={`shrink-0 ${icon}`} />
                <div className="min-w-0">
                  <p className={`text-xs ${label}`}>Cost</p>
                  <p className={`text-sm font-medium ${value}`}>{record.cost}</p>
                </div>
              </div>
            </div>

            <div className={`flex flex-wrap gap-4 text-xs pt-3 border-t ${dark ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-500'}`}>
              <span>Mileage: {record.mileage || 'N/A'}</span>
              {record.completedAt && <span>Completed: {record.completedAt}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default MaintenanceTable;
