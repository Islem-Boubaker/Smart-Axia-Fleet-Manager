import { useEffect, useId } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

interface GlobalCardProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const GlobalCard = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'lg',
}: GlobalCardProps) => {
  const titleId = useId();

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const maxWidthClasses = {
    sm: 'max-w-lg',
    md: 'max-w-2xl',
    lg: 'max-w-3xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      <button
        type="button"
        className="fixed inset-0 cursor-default bg-slate-950/55 backdrop-blur-[5px] transition-opacity"
        onClick={onClose}
        aria-label="Close modal"
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          className={`relative z-10 flex max-h-[calc(100vh-1.5rem)] w-full ${maxWidthClasses[maxWidth]} flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.26)] dark:border-cyan-100/10 dark:bg-[#07111f] dark:shadow-[0_24px_90px_rgba(0,0,0,0.65)] sm:p-5`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-5 flex shrink-0 items-center justify-between gap-4 px-1">
            {title && (
              <h2
                id={titleId}
                className="font-sans text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl"
              >
                {title}
              </h2>
            )}

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white shadow-[0_10px_22px_rgba(15,23,42,0.32)] ring-1 ring-white/40 transition-all hover:-translate-y-0.5 hover:bg-black focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-black dark:ring-white/15 dark:hover:bg-slate-900"
              aria-label="Close modal"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable body — overflow-y-auto is intentionally on this div only.
              The footer lives OUTSIDE so it is never scrolled away. */}
          <div className="min-h-0 flex-1 overflow-y-auto rounded-[22px] border border-slate-200/90 bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-cyan-100/10 dark:bg-[#0b1628] sm:p-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {children}
          </div>

          {/* Sticky footer — always visible, separated from the body by a top border + shadow.
              z-index is irrelevant here because it sits in normal flow after the scroll area. */}
          {footer && (
            <div className="shrink-0 border-t border-slate-100 dark:border-cyan-100/10 bg-white dark:bg-[#07111f] px-4 sm:px-5 py-4 shadow-[0_-4px_12px_-6px_rgba(0,0,0,0.08)]">
              {footer}
            </div>
          )}
        </section>
      </div>
    </div>,
    document.body
  );
};

