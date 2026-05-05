import { AppDataTable, AppRowActions, AppStatusBadge, AppTd, AppTr } from '../../../shared/components';
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

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-GB');
};

const DriverIssuesTable = ({
  items,
  dark = false,
  onView,
  getDriverLabel,
  getVehicleLabel,
  statusLabel,
}: DriverIssuesTableProps) => {
  return (
    <AppDataTable
      columns={['Subject', 'Driver', 'Vehicle', 'Status', 'Submitted', 'Actions']}
      totalResults={items.length}
      dark={dark}
      ariaLabel="Driver issues table"
      title="Driver issues"
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
