import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

interface RowActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}

const baseButtonClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50';

const RowActions = ({ onView, onEdit, onDelete, disabled = false }: RowActionsProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1" role="group" aria-label={t('vehicles.table.rowActions')}>
      <button
        type="button"
        aria-label={t('vehicles.table.viewDetails')}
        className={baseButtonClass}
        onClick={onView}
        disabled={disabled}
      >
        <FiEye className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={t('vehicles.table.editVehicle')}
        className={baseButtonClass}
        onClick={onEdit}
        disabled={disabled}
      >
        <FiEdit2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={t('vehicles.table.deleteVehicle')}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={onDelete}
        disabled={disabled}
      >
        <FiTrash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

export default RowActions;
