import AppRouter from "./app/router";
import { ToastProvider } from "./shared/components/toast/ToastProvider";
export default function App() {
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  );
}
