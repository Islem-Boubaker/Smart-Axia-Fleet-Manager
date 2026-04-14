import { useEffect } from 'react';
import type { ReactNode } from 'react';
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
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Soft overlay with blur */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal Window */}
        <div
          className={`relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl dark:shadow-slate-900/50 ${maxWidthClasses[maxWidth]} w-full transform transition-all scale-100 opacity-100 flex flex-col border border-transparent dark:border-slate-800`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button overlaid on top right */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 z-10"
            aria-label="Close modal"
          >
            <FiX className="w-5 h-5" />
          </button>

          {/* Content Area */}
          <div className="px-8 py-8 w-full max-h-[calc(100vh-80px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {title && (
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6">{title}</h2>
            )}
            {children}
          </div>

          {/* Footer (if provided) */}
          {footer && (
            <div className="border-t border-gray-100 dark:border-slate-800 px-8 py-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-b-2xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


