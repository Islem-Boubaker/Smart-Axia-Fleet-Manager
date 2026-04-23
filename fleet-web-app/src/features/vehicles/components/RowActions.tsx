import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';

interface RowActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}

const baseButtonClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50';

const RowActions = ({ onView, onEdit, onDelete, disabled = false }: RowActionsProps) => (
  <div className="flex items-center gap-1" role="group" aria-label="Row actions">
    <button
      type="button"
      aria-label="View vehicle details"
      className={baseButtonClass}
      onClick={onView}
      disabled={disabled}
    >
      <FiEye className="h-4 w-4" />
    </button>
    <button
      type="button"
      aria-label="Edit vehicle"
      className={baseButtonClass}
      onClick={onEdit}
      disabled={disabled}
    >
      <FiEdit2 className="h-4 w-4" />
    </button>
    <button
      type="button"
      aria-label="Delete vehicle"
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
      onClick={onDelete}
      disabled={disabled}
    >
      <FiTrash2 className="h-4 w-4" />
    </button>
  </div>
);

export default RowActions;
