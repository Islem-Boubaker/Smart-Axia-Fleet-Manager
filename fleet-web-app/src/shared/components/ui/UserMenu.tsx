import { useRef, useState, useEffect, type TouchEvent } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  FiSettings,
  FiLogOut,
  FiUser,
  FiHelpCircle,
  FiMonitor,
  FiMessageSquare,
  FiX,
  FiChevronDown,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { api } from "../../services/api";
import { clearCsrfToken } from "../../services/csrfToken";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { clearUser } from "../../../store/authSlice";
import { ROUTES } from "../../../utils/constants";

/* ── Media query hook ────────────────────────────────────────────── */
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
};

/* ── Avatar circle ───────────────────────────────────────────────── */
interface AvatarCircleProps {
  avatar: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}

const AvatarCircle = ({ avatar, name, size = "md" }: AvatarCircleProps) => {
  const initials = name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sizeClass = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-xl",
  }[size];

  return (
    <div
      className={`${sizeClass} bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold shrink-0 overflow-hidden ring-2 ring-blue-200/40 dark:ring-blue-900/60`}
    >
      {avatar ? (
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
};

/* ── Menu content (shared between desktop dropdown & mobile drawer) ── */
interface MenuContentProps {
  avatar: string | null;
  name: string;
  email: string;
  role: string;
  isRtl: boolean;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  t: ReturnType<typeof useTranslation>["t"];
}

const MenuContent = ({
  avatar,
  name,
  email,
  role,
  isRtl,
  onNavigate,
  onLogout,
  t,
}: MenuContentProps) => {
  const menuItems = [
    {
      Icon: FiSettings,
      label: t("shared.userMenu.settings"),
      action: () => onNavigate(ROUTES.SETTINGS),
    },
  ];

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      {/* ── User card ─────────────────────────────────────────────── */}
      <div className="px-4 py-4 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <AvatarCircle avatar={avatar} name={name} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
              {name}
            </p>
            {email && (
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{email}</p>
            )}
            {role && (
              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                {role}
              </span>
            )}
          </div>
        </div>

       
      </div>

      {/* ── Menu items ────────────────────────────────────────────── */}
      <div className="py-1.5">
        {menuItems.map(({ Icon, label, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            role="menuitem"
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors text-start"
          >
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 shrink-0">
              <Icon className="w-4 h-4 text-gray-600 dark:text-slate-300" />
            </span>
            <span className="flex-1 truncate">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Logout ────────────────────────────────────────────────── */}
      <div className="border-t border-gray-200 dark:border-slate-700 py-1.5">
        <button
          type="button"
          onClick={onLogout}
          role="menuitem"
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-start"
        >
          <span className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 shrink-0">
            <FiLogOut className="w-4 h-4" />
          </span>
          <span className="flex-1">{t("shared.userMenu.logout")}</span>
        </button>
      </div>
    </div>
  );
};

/* ── Main component ──────────────────────────────────────────────── */
const UserMenu = () => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { user } = useAppSelector((s) => s.auth);

  const isRtl = (i18n.language || "en").split("-")[0] === "ar";
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const name = user?.name || t("common.unknownUser", "User");
  const role = user?.role ?? "";
  const email = user?.email ?? "";
  const avatar = user?.avatar ?? null;

  /* ── Open / close with CSS transition ───────────────────────────── */
  const openMenu = () => {
    setOpen(true);
    // Two rAF to ensure the element is painted before animating
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  };

  const closeMenu = () => {
    setVisible(false);
    setTimeout(() => setOpen(false), 280);
  };

  /* ── Click outside — desktop only ───────────────────────────────── */
  useEffect(() => {
    if (!open || isMobile) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, isMobile]);

  /* ── Escape key ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  /* ── Body scroll lock (mobile drawer) ───────────────────────────── */
  useEffect(() => {
    if (!open || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isMobile]);

  /* ── Swipe-down to close (mobile) ───────────────────────────────── */
  const touchStartY = useRef(0);
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (e.changedTouches[0].clientY - touchStartY.current > 60) closeMenu();
  };

  /* ── Shared actions (stable refs) ───────────────────────────────── */
  const handleNavigate = (path: string) => {
    closeMenu();
    navigate(path);
  };

  const handleLogout = async () => {
    closeMenu();
    try {
      await api.post("/user/logout");
    } catch {
      // ignore — we always clear local state
    } finally {
      dispatch(clearUser());
      clearCsrfToken();
      queryClient.clear();
      navigate(ROUTES.SIGN_IN, { replace: true });
    }
  };

  const sharedMenuProps: MenuContentProps = {
    avatar,
    name,
    email,
    role,
    isRtl,
    onNavigate: handleNavigate,
    onLogout: handleLogout,
    t,
  };

  /* ── Desktop dropdown ────────────────────────────────────────────── */
  const desktopDropdown = open ? (
    <div
      role="menu"
      aria-label={t("shared.userMenu.menuAria")}
      className={[
        "hidden lg:flex flex-col",
        "absolute top-[calc(100%+0.625rem)]",
        "w-[320px] max-w-[calc(100vw-2rem)]",
        "bg-white dark:bg-slate-900",
        "rounded-2xl shadow-2xl",
        "border border-gray-200 dark:border-slate-700",
        "z-[200] overflow-hidden",
        "transition-all duration-200 ease-out",
        visible
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-95 -translate-y-2",
      ].join(" ")}
      style={isRtl ? { left: 0 } : { right: 0 }}
    >
      <MenuContent {...sharedMenuProps} />
    </div>
  ) : null;

  /* ── Mobile bottom drawer (portalled to body) ───────────────────── */
  const mobileDrawer =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="lg:hidden" dir={isRtl ? "rtl" : "ltr"}>
            {/* Backdrop */}
            <div
              className={[
                "fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm",
                "transition-opacity duration-300",
                visible ? "opacity-100" : "opacity-0 pointer-events-none",
              ].join(" ")}
              onClick={closeMenu}
              aria-hidden="true"
            />

            {/* Drawer slides up from bottom */}
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t("shared.userMenu.menuAria")}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className={[
                "fixed bottom-0 inset-x-0 z-[9999]",
                "max-h-[92vh] min-h-[60vh]",
                "bg-white dark:bg-slate-900",
                "rounded-t-3xl shadow-2xl",
                "flex flex-col",
                "transition-transform duration-300 ease-out",
                visible ? "translate-y-0" : "translate-y-full",
              ].join(" ")}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-2.5 pb-0 shrink-0">
                <div className="w-10 h-1 bg-gray-200 dark:bg-slate-700 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-800 shrink-0">
                <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {t("shared.userMenu.account")}
                </span>
                <button
                  type="button"
                  onClick={closeMenu}
                  aria-label={t("shared.userMenu.closeMenu")}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable menu content */}
              <div className="flex-1 min-h-0 overflow-y-auto" role="menu">
                <MenuContent {...sharedMenuProps} />
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  /* ── Trigger button ─────────────────────────────────────────────── */
  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => (open ? closeMenu() : openMenu())}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("shared.userMenu.menuAria")}
        className="flex items-center rounded-xl transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-slate-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
      >
        {/* Mobile / tablet ≤ lg: avatar circle only */}
        <span className="flex p-1.5">
          <AvatarCircle avatar={avatar} name={name} size="sm" />
        </span>
      </button>

      {desktopDropdown}
      {mobileDrawer}
    </div>
  );
};

export default UserMenu;
