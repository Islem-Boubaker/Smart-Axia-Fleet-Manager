// ─────────────────────────────────────────────────────────────
//  ToastProvider — wraps the app and renders toast stack
// ─────────────────────────────────────────────────────────────
import { useState, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ToastContext } from './ToastContext';
import ToastItem from './ToastItem';
import { subscribeToastActions } from './toast';
import type { Toast, ToastType, ToastOptions, ToastContextValue } from './toast.types';

/* ── Default titles per type ──────────────────────────────── */
const defaultTitles: Record<ToastType, string> = {
  success: 'Success',
  error: 'Error',
  info: 'Info',
  loading: 'Loading',
};

/* ── Default durations (ms) per type ──────────────────────── */
const defaultDurations: Record<ToastType, number> = {
  success: 4000,
  error: 5000,
  info: 4000,
  loading: 0, // loading toasts stay until manually dismissed / updated
};

const MAX_TOASTS = 5;
let counter = 0;

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (type: ToastType, message: string, options?: ToastOptions): string => {
      const id = `toast-${++counter}-${Date.now()}`;
      const toast: Toast = {
        id,
        type,
        title: options?.title ?? defaultTitles[type],
        message,
        duration: options?.duration ?? defaultDurations[type],
        createdAt: Date.now(),
      };

      setToasts((prev) => {
        const next = [...prev, toast];
        // Keep only the latest MAX_TOASTS
        return next.length > MAX_TOASTS ? next.slice(-MAX_TOASTS) : next;
      });

      return id;
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateToast = useCallback(
    (id: string, updates: Partial<Pick<Toast, 'type' | 'title' | 'message' | 'duration'>>) => {
      setToasts((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const updated = { ...t, ...updates };
          // If switching away from loading, apply a default duration so it auto-dismisses
          if (t.type === 'loading' && updates.type && updates.type !== 'loading' && !updates.duration) {
            updated.duration = defaultDurations[updates.type];
          }
          // Reset createdAt so auto-dismiss timer restarts
          updated.createdAt = Date.now();
          return updated;
        }),
      );
    },
    [],
  );

  const value: ToastContextValue = useMemo(
    () => ({ toasts, addToast, removeToast, updateToast }),
    [toasts, addToast, removeToast, updateToast],
  );

  // Subscribe to imperative toast actions (from toast.ts event bus)
  useEffect(() => {
    return subscribeToastActions((action) => {
      switch (action.kind) {
        case 'add': {
          const id = addToast(action.type, action.message, action.options);
          action.resolve(id);
          break;
        }
        case 'remove':
          removeToast(action.id);
          break;
        case 'update':
          updateToast(action.id, action.updates);
          break;
      }
    });
  }, [addToast, removeToast, updateToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-label="Notifications"
          className="fixed top-4 right-4 z-[99999] flex flex-col gap-3 pointer-events-none"
        >
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onRemove={removeToast} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
