import { AppDataTable, AppRowActions, AppStatusBadge, AppTd, AppTr } from '../../../shared/components';
import { useTranslation } from 'react-i18next';
import type { ReclamationRecord, ReclamationStatus } from '../services/reclamations.service';

interface DriverIssuesTableProps {
  items: ReclamationRecord[];
  dark?: boolean;
  onView: (item: ReclamationRecord) => void;
  getDriverLabel: (item: ReclamationRecord) => string;
  getVehicleLabel: (item: ReclamationRecord) => string;
  statusLabel: Record<ReclamationStatus, string>;
}

const statusVariant: Record<ReclamationStatus, 'warning' | 'info' | 'success' | 'danger'> = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
  REJECTED: 'danger',
};

const DriverIssuesTable = ({
  items,
  dark = false,
  onView,
  getDriverLabel,
  getVehicleLabel,
  statusLabel,
}: DriverIssuesTableProps) => {
  const { t, i18n } = useTranslation();
  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(i18n.language);
  };
  return (
    <AppDataTable
      columns={[
        t('reclamations.table.subject'),
        t('reclamations.table.driver'),
        t('reclamations.table.vehicle'),
        t('reclamations.table.status'),
        t('reclamations.table.submitted'),
        t('reclamations.table.actions'),
      ]}
      totalResults={items.length}
      dark={dark}
      ariaLabel={t('reclamations.table.aria')}
      pageSize={7}
    >
      {items.map((item) => (
        <AppTr key={item.id}>
          <AppTd className={dark ? 'text-slate-100' : 'text-slate-900'}>
            <div>
              <p className="font-semibold">{item.subject}</p>
              <p className={`line-clamp-2 text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{item.message}</p>
            </div>
          </AppTd>

          <AppTd className={dark ? 'text-slate-300' : 'text-slate-700'}>{getDriverLabel(item)}</AppTd>
          <AppTd className={dark ? 'text-slate-300' : 'text-slate-700'}>{getVehicleLabel(item)}</AppTd>

          <AppTd>
            <AppStatusBadge variant={statusVariant[item.status]}>{statusLabel[item.status]}</AppStatusBadge>
          </AppTd>

          <AppTd className={dark ? 'text-slate-400' : 'text-slate-600'}>{formatDateTime(item.createdAt)}</AppTd>

          <AppTd>
            <AppRowActions onView={() => onView(item)} />
          </AppTd>
        </AppTr>
      ))}
    </AppDataTable>
  );
};

export default DriverIssuesTable;
