import { memo, useMemo } from 'react';
import { AppDataTable, AppRowActions, AppStatusBadge, AppTd, AppTr, Button } from '../../../shared/components';
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
  const records = useMemo(() => data ?? [], [data]);

  const getStatusColor = (status: string) => {
    const normalized = String(status).replace(/_/g, '-');
    if (normalized === 'completed') return 'success';
    if (normalized === 'in-progress') return 'info';
    if (normalized === 'pending' || normalized === 'scheduled') return 'warning';
    if (normalized === 'cancelled') return 'danger';
    return 'neutral';
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'danger';
    if (priority === 'medium') return 'warning';
    if (priority === 'low') return 'success';
    return 'neutral';
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

  return (
    <AppDataTable
      columns={['Type', 'Vehicle', 'Date', 'Technician', 'Priority', 'Status', 'Cost', 'Actions']}
      totalResults={records.length}
      dark={dark}
      ariaLabel="Maintenance table"
      pageSize={7}
    >
      {records.map((record) => (
        <AppTr key={record.id}>
          <AppTd className={dark ? 'text-slate-100' : 'text-slate-900'}>{record.type || 'Maintenance'}</AppTd>

          <AppTd className={dark ? 'text-slate-200' : 'text-slate-700'}>
            {record.vehicleName
              ? `${record.vehicleName}${record.vehiclePlate ? ` (${record.vehiclePlate})` : ''}`
              : record.vehiclePlate || 'N/A'}
          </AppTd>

          <AppTd className={dark ? 'text-slate-300' : 'text-slate-600'}>{record.scheduledDate}</AppTd>
          <AppTd className={dark ? 'text-slate-300' : 'text-slate-600'}>{record.technician || 'TBD'}</AppTd>

          <AppTd>
            <AppStatusBadge variant={getPriorityColor(record.priority)}>{record.priority}</AppStatusBadge>
          </AppTd>

          <AppTd>
            <AppStatusBadge variant={getStatusColor(record.status)}>{record.status}</AppStatusBadge>
          </AppTd>

          <AppTd className={dark ? 'text-slate-300' : 'text-slate-600'}>{record.cost}</AppTd>

          <AppTd>
            <div className="flex items-center gap-2">
              {(record.status === 'scheduled' || record.status === 'pending' || record.status === 'in_progress') && (
                <Button type="button" size="sm" variant="secondary" onClick={() => handleTransition(record)}>
                  {getActionLabel(record.status)}
                </Button>
              )}
              <AppRowActions onEdit={() => onEdit?.(record)} onDelete={() => onRemove?.(record)} />
            </div>
          </AppTd>
        </AppTr>
      ))}
    </AppDataTable>
  );
});

export default MaintenanceTable;
