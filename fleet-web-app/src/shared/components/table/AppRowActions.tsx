import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isRtl = (i18n.language || 'en').split('-')[0] === 'ar';

  const hasActions = onView || onEdit || onDelete || onCancel || onStart;

  const computeAndOpen = () => {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();

    const style: React.CSSProperties = { position: 'fixed', zIndex: 9999, minWidth: 160 };

    // Always open downward
    style.top = rect.bottom + 4;

    // Pin menu end to button end (same as CSS `end-0`):
    // LTR → right-align; RTL → left-align
    if (isRtl) {
      style.left = rect.left;
    } else {
      style.right = window.innerWidth - rect.right;
    }

    setMenuStyle(style);
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;

    const close = () => setIsOpen(false);

    const handleOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        close();
      }
    };

    document.addEventListener('mousedown', handleOutside);
    // Close on any scroll (table scroll, page scroll, nested scroll)
    document.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  if (!hasActions) return null;

  const closeAnd = (fn?: () => void) => {
    fn?.();
    setIsOpen(false);
  };

  const menu = isOpen
    ? createPortal(
        <div
          style={menuStyle}
          className="rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800"
          // Prevent the mousedown-outside handler from firing when clicking inside the menu
          onMouseDown={(e) => e.stopPropagation()}
        >
          {onView && (
            <button
              type="button"
              onClick={() => closeAnd(onView)}
              className="flex w-full items-center gap-2 whitespace-nowrap px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <BiShow className="h-4 w-4 shrink-0" />
              {t('dataTable.viewDetails')}
            </button>
          )}

          {onStart && (
            <button
              type="button"
              onClick={() => closeAnd(onStart)}
              className="flex w-full items-center gap-2 whitespace-nowrap px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <BiPlay className="h-4 w-4 shrink-0" />
              {startLabel ?? t('dataTable.startAction')}
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => closeAnd(onEdit)}
              className="flex w-full items-center gap-2 whitespace-nowrap px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <BiPencil className="h-4 w-4 shrink-0" />
              {t('dataTable.editRow')}
            </button>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={() => closeAnd(onCancel)}
              className="flex w-full items-center gap-2 whitespace-nowrap px-4 py-2 text-sm text-amber-600 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-400/10"
            >
              <BiX className="h-4 w-4 shrink-0" />
              {t('dataTable.cancelAction')}
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => closeAnd(onDelete)}
              className="flex w-full items-center gap-2 whitespace-nowrap px-4 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-400/10"
            >
              <BiTrash className="h-4 w-4 shrink-0" />
              {t('dataTable.deleteRow')}
            </button>
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="inline-block">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={t('dataTable.rowActions')}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? setIsOpen(false) : computeAndOpen())}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white/80 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-cyan-300/10 dark:hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <BiDotsHorizontalRounded className="h-5 w-5" />
      </button>

      {menu}
    </div>
  );
};

export default AppRowActions;
