import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

interface AppRowActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}

const baseClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white/80 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-cyan-300/10 dark:hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50';

const AppRowActions = ({ onView, onEdit, onDelete, disabled = false }: AppRowActionsProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1" role="group" aria-label={t('dataTable.rowActions')}>
      {onView && (
        <button type="button" aria-label={t('dataTable.viewDetails')} className={baseClass} onClick={onView} disabled={disabled}>
          <FiEye className="h-4 w-4" />
        </button>
      )}
      {onEdit && (
        <button type="button" aria-label={t('dataTable.editRow')} className={baseClass} onClick={onEdit} disabled={disabled}>
          <FiEdit2 className="h-4 w-4" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          aria-label={t('dataTable.deleteRow')}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onDelete}
          disabled={disabled}
        >
          <FiTrash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default AppRowActions;
