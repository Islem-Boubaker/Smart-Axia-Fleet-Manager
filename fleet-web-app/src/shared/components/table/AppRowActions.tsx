import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';

interface AppRowActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}

const baseClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50';

const AppRowActions = ({ onView, onEdit, onDelete, disabled = false }: AppRowActionsProps) => {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Row actions">
      {onView && (
        <button type="button" aria-label="View details" className={baseClass} onClick={onView} disabled={disabled}>
          <FiEye className="h-4 w-4" />
        </button>
      )}
      {onEdit && (
        <button type="button" aria-label="Edit row" className={baseClass} onClick={onEdit} disabled={disabled}>
          <FiEdit2 className="h-4 w-4" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          aria-label="Delete row"
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
