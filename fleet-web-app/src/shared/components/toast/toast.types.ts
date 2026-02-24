// ─────────────────────────────────────────────────────────────
//  Toast type definitions — Axia Fleet
// ─────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface Toast {
  /** Unique identifier (auto-generated) */
  id: string;
  /** Visual variant */
  type: ToastType;
  /** Bold top-line text (e.g. "Success", "Error") */
  title: string;
  /** Descriptive message body */
  message: string;
  /** Auto-dismiss duration in ms (0 = no auto-dismiss) */
  duration: number;
  /** Internal: ISO timestamp of creation */
  createdAt: number;
}

export type ToastOptions = Partial<Pick<Toast, 'title' | 'duration'>>;

export interface ToastContextValue {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, options?: ToastOptions) => string;
  removeToast: (id: string) => void;
  /** Update an existing toast (useful for loading → success/error) */
  updateToast: (id: string, updates: Partial<Pick<Toast, 'type' | 'title' | 'message' | 'duration'>>) => void;
}
