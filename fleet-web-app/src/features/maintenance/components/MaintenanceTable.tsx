import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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

const normalizeKey = (value: string) => String(value || '').toLowerCase().replace(/[\s-]+/g, '_');

const MaintenanceTable = memo(({ data, dark = false, onUpdate, onTransition, onEdit, onRemove }: MaintenanceTableProps) => {
  const { t, i18n } = useTranslation();
  const records = useMemo(() => data ?? [], [data]);
  const locale = i18n.language || 'en';

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
    if (status === 'scheduled' || status === 'pending') return t('maintenance.table.startMaintenance');
    if (status === 'in_progress') return t('maintenance.table.completeMaintenance');
    return t('maintenance.table.noAction');
  };

  const handleTransition = async (record: Maintenance) => {
    if (!onTransition) return;
    await onTransition(record);
    if (onUpdate) onUpdate();
  };

  const formatDate = (value?: string) => {
    if (!value) return t('common.na');
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString(locale);
  };

  return (
    <AppDataTable
      columns={[
        t('common.type'),
        t('common.vehicle'),
        t('common.date'),
        t('maintenance.table.technician'),
        t('common.priority'),
        t('common.status'),
        t('common.cost'),
        t('common.actions'),
      ]}
      totalResults={records.length}
      dark={dark}
      ariaLabel={t('maintenance.table.aria')}
      title={t('maintenance.title')}
      pageSize={7}
    >
      {records.map((record) => (
        <AppTr key={record.id}>
          <AppTd className={dark ? 'text-slate-100' : 'text-slate-900'}>
            {record.type ? t(`maintenance.types.${normalizeKey(record.type)}`, { defaultValue: record.type }) : t('common.maintenance')}
          </AppTd>

          <AppTd className={dark ? 'text-slate-200' : 'text-slate-700'}>
            {record.vehicleName
              ? `${record.vehicleName}${record.vehiclePlate ? ` (${record.vehiclePlate})` : ''}`
              : record.vehiclePlate || t('common.na')}
          </AppTd>

          <AppTd className={dark ? 'text-slate-300' : 'text-slate-600'}>{formatDate(record.scheduledDate)}</AppTd>
          <AppTd className={dark ? 'text-slate-300' : 'text-slate-600'}>{record.technician || t('maintenance.table.tbd')}</AppTd>

          <AppTd>
            <AppStatusBadge variant={getPriorityColor(record.priority)}>
              {t(`priority.${normalizeKey(record.priority)}`, { defaultValue: record.priority })}
            </AppStatusBadge>
          </AppTd>

          <AppTd>
            <AppStatusBadge variant={getStatusColor(record.status)}>
              {t(`status.${normalizeKey(record.status)}`, { defaultValue: record.status })}
            </AppStatusBadge>
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
