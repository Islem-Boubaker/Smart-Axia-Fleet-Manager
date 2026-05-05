import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import AppRouter from "./app/router";
import { ToastProvider } from "./shared/components/toast/ToastProvider";
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

export default function App() {
  return (
    <ToastProvider>
      <I18nDocumentSync />
      <AppRouter />
    </ToastProvider>
  );
}
