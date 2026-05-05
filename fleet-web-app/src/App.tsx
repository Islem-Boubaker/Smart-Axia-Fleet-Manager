import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import AppRouter from "./app/router";
import { authAPI } from "./features/auth/services/auth.service";
import { clearUser, setLoading, setUser } from "./store/authSlice";
import { useAppDispatch } from "./shared/hooks";

function I18nDocumentSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lng = (i18n.language || "en").split("-")[0] || "en";
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language || "en";
  }, [i18n.language]);

  return null;
}

export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        dispatch(setLoading(true));
        const user = await authAPI.getMe();
        if (mounted) dispatch(setUser(user));
      } catch {
        if (mounted) dispatch(clearUser());
      } finally {
        if (mounted) dispatch(setLoading(false));
      }
    };

    void restoreSession();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  return (
    <>
      <I18nDocumentSync />
      <AppRouter />
    </>
  );
}
