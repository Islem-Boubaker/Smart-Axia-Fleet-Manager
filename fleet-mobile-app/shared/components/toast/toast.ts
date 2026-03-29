export type ToastType = "success" | "error" | "info";

export interface ToastOptions {
  title?: string;
  duration?: number;
}

type ToastAction = {
  kind: "add";
  type: ToastType;
  message: string;
  options?: ToastOptions;
} | {
  kind: "remove";
  id: string;
};

type Listener = (action: ToastAction) => void;

const listeners = new Set<Listener>();

export function subscribeToastActions(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function dispatch(action: ToastAction) {
  listeners.forEach((listener) => listener(action));
}

export const toast = {
  success(message: string, options?: ToastOptions) {
    dispatch({ kind: "add", type: "success", message, options });
  },
  error(message: string, options?: ToastOptions) {
    dispatch({ kind: "add", type: "error", message, options });
  },
  info(message: string, options?: ToastOptions) {
    dispatch({ kind: "add", type: "info", message, options });
  },
  dismiss(id: string) {
    dispatch({ kind: "remove", id });
  },
};
