import { useRef, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { clearCsrfToken } from "../../services/csrfToken";
import { useAppDispatch } from "../../hooks";
import { clearUser } from "../../../store/authSlice";
import { ROUTES } from "../../../utils/constants";
import UserAvatar from "./UserAvatar";
import { useTranslation } from "react-i18next";

const UserMenu = () => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const isRtl = (i18n.language || "en").split("-")[0] === "ar";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const handleSettings = () => {
    setOpen(false);
    navigate(ROUTES.SETTINGS);
  };

  const handleLogout = async () => {
    setOpen(false);
    try {
      await api.post("/user/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      dispatch(clearUser());
      clearCsrfToken();
      queryClient.clear();
      navigate(ROUTES.SIGN_IN, { replace: true });
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>

      {/* ── Trigger ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center  w-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded-xl transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-slate-800/80"
      >
        {/* Mobile/tablet: avatar only */}
        <span className="flex lg:hidden p-1 sm:p-1.5">
          <UserAvatar compact />
        </span>

        {/* Desktop: avatar + chevron */}
        <span className={`hidden lg:flex items-center gap-3 p-3 ${isRtl ? "flex-row-reverse" : ""}`}>
          <UserAvatar />
          <svg
            className={`w-4 h-4 text-gray-400 dark:text-slate-400 transition-transform duration-200 shrink-0 ${
              open ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* ── Dropdown ─────────────────────────────────────────────────── */}
      {open && (
        <div
          className="absolute mt-1 z-50 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 sm:w-44 lg:w-56"
          style={isRtl ? { left: 0 } : { right: 0 }}
        >
          {/* Settings */}
          <button
            onClick={handleSettings}
            className={`w-full flex items-center px-3 py-2 text-xs transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-slate-800 sm:px-4 sm:py-2.5 sm:text-sm ${
              isRtl ? "flex-row-reverse gap-2 text-right sm:gap-3" : "gap-2 text-left sm:gap-3"
            } text-gray-700 dark:text-gray-300`}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{t("shared.userMenu.settings")}</span>
          </button>

          <div className="border-t border-gray-100 dark:border-slate-700" />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center px-3 py-2 text-xs transition-colors duration-150 hover:bg-red-50 dark:hover:bg-red-950/40 sm:px-4 sm:py-2.5 sm:text-sm ${
              isRtl ? "flex-row-reverse gap-2 text-right sm:gap-3" : "gap-2 text-left sm:gap-3"
            } text-red-600 dark:text-red-400`}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>{t("shared.userMenu.logout")}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
