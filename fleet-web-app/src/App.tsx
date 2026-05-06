import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import AppRouter from "./app/router";
import { ToastProvider } from "./shared/components/toast/ToastProvider";
import { useAppDispatch } from "./shared/hooks";
import { authAPI } from "./features/auth/services/auth.service";
import { clearUser, setLoading, setUser } from "./store/authSlice";
import "./i18n";

function I18nDocumentSync() {
  const { i18n } = useTranslation();
  useEffect(() => {
    const lng = (i18n.language || "en").split("-")[0] || "en";
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  return null;
}

function AuthBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      dispatch(setLoading(true));
      try {
        const user = await authAPI.getMe();
        if (!active) return;
        dispatch(setUser(user));
      } catch {
        if (!active) return;
        dispatch(clearUser());
      } finally {
        if (active) dispatch(setLoading(false));
      }
    };

    bootstrap();
    return () => {
      active = false;
    };
  }, [dispatch]);

  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthBootstrap />
      <I18nDocumentSync />
      <AppRouter />
    </ToastProvider>
  );
}
