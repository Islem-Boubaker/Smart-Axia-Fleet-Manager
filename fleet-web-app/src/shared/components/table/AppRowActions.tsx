import { useEffect, useRef, useState } from 'react';
import { BiDotsHorizontalRounded, BiPencil, BiShow, BiTrash, BiPlay, BiX } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';

interface AppRowActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
  onStart?: () => void;
  /** Override the "Start" label (e.g. pass "Complete" for in-progress maintenance). */
  startLabel?: string;
  disabled?: boolean;
}

const AppRowActions = ({
  onView,
  onEdit,
  onDelete,
  onCancel,
  onStart,
  startLabel,
  disabled = false,
}: AppRowActionsProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const hasActions = onView || onEdit || onDelete || onCancel || onStart;
  if (!hasActions) return null;

  const close = (fn?: () => void) => {
    fn?.();
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        aria-label={t('dataTable.rowActions')}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white/80 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-cyan-300/10 dark:hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <BiDotsHorizontalRounded className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute end-0 z-50 mt-1 min-w-[160px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {onView && (
            <button
              type="button"
              onClick={() => close(onView)}
              className="flex w-full items-center gap-2 whitespace-nowrap px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <BiShow className="h-4 w-4 shrink-0" />
              {t('dataTable.viewDetails')}
            </button>
          )}

          {onStart && (
            <button
              type="button"
              onClick={() => close(onStart)}
              className="flex w-full items-center gap-2 whitespace-nowrap px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <BiPlay className="h-4 w-4 shrink-0" />
              {startLabel ?? t('dataTable.startAction')}
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => close(onEdit)}
              className="flex w-full items-center gap-2 whitespace-nowrap px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <BiPencil className="h-4 w-4 shrink-0" />
              {t('dataTable.editRow')}
            </button>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={() => close(onCancel)}
              className="flex w-full items-center gap-2 whitespace-nowrap px-4 py-2 text-sm text-amber-600 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-400/10"
            >
              <BiX className="h-4 w-4 shrink-0" />
              {t('dataTable.cancelAction')}
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => close(onDelete)}
              className="flex w-full items-center gap-2 whitespace-nowrap px-4 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-400/10"
            >
              <BiTrash className="h-4 w-4 shrink-0" />
              {t('dataTable.deleteRow')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AppRowActions;
