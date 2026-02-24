// ─────────────────────────────────────────────────────────────
//  toast — imperative helper (works outside React components)
//
//  Usage:
//    import { toast } from '@/shared/components/toast';
//    toast.success('Vehicle created!');
//    toast.error('Upload failed');
//    const id = toast.loading('Saving…');
//    toast.update(id, { type: 'success', message: 'Saved!' });
//    toast.dismiss(id);
// ─────────────────────────────────────────────────────────────
import type { Toast, ToastType, ToastOptions } from './toast.types';

type Listener = (action: ToastAction) => void;

type ToastAction =
  | { kind: 'add'; type: ToastType; message: string; options?: ToastOptions; resolve: (id: string) => void }
  | { kind: 'remove'; id: string }
  | { kind: 'update'; id: string; updates: Partial<Pick<Toast, 'type' | 'title' | 'message' | 'duration'>> };

/* ── Internal event bus ───────────────────────────────────── */
const listeners = new Set<Listener>();

export function subscribeToastActions(fn: Listener) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function dispatch(action: ToastAction) {
  listeners.forEach((fn) => fn(action));
}

/* ── Public API ───────────────────────────────────────────── */
function createToast(type: ToastType, message: string, options?: ToastOptions): string {
  let toastId = '';
  dispatch({
    kind: 'add',
    type,
    message,
    options,
    resolve: (id) => { toastId = id; },
  });
  return toastId;
}

export const toast = {
  success: (message: string, options?: ToastOptions) => createToast('success', message, options),
  error: (message: string, options?: ToastOptions) => createToast('error', message, options),
  info: (message: string, options?: ToastOptions) => createToast('info', message, options),
  loading: (message: string, options?: ToastOptions) => createToast('loading', message, options),

  /** Update an existing toast (e.g. loading → success) */
  update: (id: string, updates: Partial<Pick<Toast, 'type' | 'title' | 'message' | 'duration'>>) => {
    dispatch({ kind: 'update', id, updates });
  },

  /** Remove a toast immediately */
  dismiss: (id: string) => {
    dispatch({ kind: 'remove', id });
  },
};
