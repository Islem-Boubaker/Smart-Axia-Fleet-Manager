// ─────────────────────────────────────────────────────────────
//  ToastItem — individual toast rendering
// ─────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import { FiCheck, FiX, FiInfo } from 'react-icons/fi';
import type { Toast } from './toast.types';

/* ── Icon per type ─────────────────────────────────────────── */
const icons: Record<Toast['type'], React.ReactNode> = {
  success: <FiCheck className="w-5 h-5" />,
  error: <FiX className="w-5 h-5" />,
  info: <FiInfo className="w-5 h-5" />,
  loading: (
    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  ),
};

/* ── Colour map ────────────────────────────────────────────── */
const styles: Record<Toast['type'], { bg: string; icon: string; border: string; title: string }> = {
  success: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-600',
    border: 'border-green-200',
    title: 'text-green-800',
  },
  error: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-600',
    border: 'border-red-200',
    title: 'text-red-800',
  },
  info: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    border: 'border-blue-200',
    title: 'text-blue-800',
  },
  loading: {
    bg: 'bg-gray-50',
    icon: 'bg-gray-200 text-gray-600',
    border: 'border-gray-200',
    title: 'text-gray-800',
  },
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem = ({ toast, onRemove }: ToastItemProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const s = styles[toast.type];

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300); // match exit animation duration
  }, [onRemove, toast.id]);

  // Slide-in on mount — double rAF ensures the browser has painted
  // the initial (off-screen) frame before we transition in.
  // This avoids batching issues in production / StrictMode.
  useEffect(() => {
    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setIsVisible(true);
      });
    });
    return () => { cancelled = true; };
  }, []);

  // Auto-dismiss timer (keyed on createdAt so it resets after updates)
  useEffect(() => {
    if (toast.duration <= 0) return;
    const timeout = setTimeout(handleClose, toast.duration);
    return () => clearTimeout(timeout);
  }, [toast.duration, toast.createdAt, handleClose]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        pointer-events-auto w-80 overflow-hidden rounded-xl border shadow-lg
        transition-all duration-300 ease-out
        ${s.bg} ${s.border}
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg ${s.icon}`}>
          {icons[toast.type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${s.title}`}>{toast.title}</p>
          <p className="text-sm text-gray-600 mt-0.5 break-words">{toast.message}</p>
        </div>

        {/* Close button (hidden for loading toasts) */}
        {toast.type !== 'loading' && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-md hover:bg-gray-100"
            aria-label="Close notification"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress bar for timed toasts */}
      {toast.duration > 0 && toast.type !== 'loading' && (
        <div className="h-1 w-full bg-black/5">
          <div
            className={`h-full ${toast.type === 'success' ? 'bg-green-400' : toast.type === 'error' ? 'bg-red-400' : 'bg-blue-400'}`}
            style={{
              animation: `toast-progress ${toast.duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ToastItem;
