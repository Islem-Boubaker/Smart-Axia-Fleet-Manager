import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import UserAvatar from "../ui/UserAvatar";
import {
  FiHome,
  FiTruck,
  FiUsers,
  FiMapPin,
  FiTool,
  FiBarChart2,
  FiAlertCircle,
  FiSettings,
  FiX,
  FiChevronRight,
  FiUser,
  FiBell,
  FiShield,
} from "react-icons/fi";
import { ROUTES } from "../../../utils/constants";

const BRAND_LOGO_SRC = "/images/OFFICIAL%20LOGO.png";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  dark?: boolean;
}

const settingsSubItems = [
  {
    icon: FiUser,
    label: "Profile",
    path: `${ROUTES.SETTINGS}?tab=profile`,
    tab: "profile",
  },
  {
    icon: FiBell,
    label: "Notifications",
    path: `${ROUTES.SETTINGS}?tab=notifications`,
    tab: "notifications",
  },
  {
    icon: FiShield,
    label: "Security",
    path: `${ROUTES.SETTINGS}?tab=security`,
    tab: "security",
  },
];

export const Sidebar = memo(
  ({ isOpen, setIsOpen, expanded, setExpanded, dark = false }: SidebarProps) => {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const isRtl = (i18n.language || "en").split("-")[0] === "ar";
    const [settingsOpen, setSettingsOpen] = useState(
      location.pathname.startsWith(ROUTES.SETTINGS),
    );

    // On mobile the open drawer always shows labels (acts like expanded).
    // On desktop, labels follow the `expanded` prop only.
    const showLabels = expanded || isOpen;

    const localizedSettingsSubItems = useMemo(
      () =>
        settingsSubItems.map((item) => ({
          ...item,
          label: t(`settings.sidebar.${item.tab}`),
        })),
      [t],
    );

    const menuItems = useMemo(
      () => [
        { icon: FiHome,       label: t("nav.dashboard"),    path: ROUTES.DASHBOARD },
        { icon: FiTruck,      label: t("nav.vehicles"),     path: ROUTES.VEHICLES },
        { icon: FiUsers,      label: t("nav.drivers"),      path: ROUTES.DRIVERS },
        { icon: FiMapPin,     label: t("nav.trips"),        path: ROUTES.TRIPS },
        { icon: FiTool,       label: t("nav.maintenance"),  path: ROUTES.MAINTENANCE },
        { icon: FiBarChart2,  label: t("nav.reports"),      path: ROUTES.REPORTS },
        {
          icon: FiAlertCircle,
          label: t("nav.reclamations"),
          path: ROUTES.DRIVER_ISSUES,
        },
        {
          icon: FiSettings,
          label: t("nav.settings"),
          path: ROUTES.SETTINGS,
          hasCollapse: true,
          children: localizedSettingsSubItems,
        },
      ],
      [localizedSettingsSubItems, t],
    );

    const base = dark
      ? {
          bg: "bg-[#07111F]/95",
          border: "border-cyan-200/10",
          sub: "text-slate-400",
          hover: "hover:bg-cyan-300/10 hover:text-cyan-50",
          activeBg: "bg-white text-slate-950 shadow-sm",
          overlay: "bg-slate-950/70",
          subitemHover: "hover:bg-cyan-300/10 hover:text-cyan-50",
          subitemActive: "bg-cyan-300/15 text-cyan-50 font-medium ring-1 ring-cyan-200/20",
        }
      : {
          bg: "bg-[#111827]",
          border: "border-white/10",
          sub: "text-slate-400",
          hover: "hover:bg-white/10 hover:text-white",
          activeBg: "bg-white text-slate-950",
          overlay: "bg-black/40",
          subitemHover: "hover:bg-white/10 hover:text-white",
          subitemActive: "bg-white/15 text-white font-medium",
        };

    const isSubItemActive = (tab: string) => {
      const searchParams = new URLSearchParams(location.search);
      return (
        location.pathname === ROUTES.SETTINGS && searchParams.get("tab") === tab
      );
    };

    const renderNavItem = (item: typeof menuItems[0]) => {
      const isActive =
        location.pathname === item.path ||
        location.pathname.startsWith(item.path + "/");
      const Icon = item.icon;
      const hasChildren = item.hasCollapse && item.children;

      if (hasChildren) {
        return (
          <div key={item.path} className="space-y-2">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`
                w-full flex items-center justify-between
                ${showLabels ? "gap-3 px-3 py-2.5" : "justify-center px-0 py-0"}
                rounded-2xl transition-colors duration-150
                ${isActive ? base.activeBg : `${base.sub} ${base.hover}`}
              `}
            >
              <div
                className={`${showLabels ? "h-6 w-6" : "h-12 w-full"} flex items-center justify-center shrink-0`}
              >
                <Icon className="text-[15px]" />
              </div>
              {showLabels && (
                <>
                  <span className="truncate text-sm font-bold flex-1">{item.label}</span>
                  <FiChevronRight
                    size={16}
                    className={`shrink-0 transition-transform ${settingsOpen ? "rotate-90" : ""}`}
                  />
                </>
              )}
            </button>

            {showLabels && settingsOpen && item.children && (
              <div className={`space-y-1.5 ${isRtl ? "pr-4" : "pl-4"}`}>
                {item.children.map((child) => {
                  const isChildActive = isSubItemActive(child.tab);
                  const ChildIcon = child.icon;
                  return (
                    <Link
                      key={child.path}
                      to={child.path}
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold
                        transition-colors duration-100
                        ${isChildActive ? base.subitemActive : `${base.sub} ${base.subitemHover}`}
                      `}
                    >
                      <ChildIcon size={13} className="shrink-0" />
                      <span className="truncate">{child.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {!showLabels && settingsOpen && item.children && (
              <div className="space-y-1.5">
                {item.children.map((child) => {
                  const isChildActive = isSubItemActive(child.tab);
                  const ChildIcon = child.icon;
                  return (
                    <Link
                      key={child.path}
                      to={child.path}
                      onClick={() => setIsOpen(false)}
                      title={child.label}
                      className={`
                        h-10 w-full flex items-center justify-center rounded-xl text-[13px]
                        transition-colors duration-100
                        ${isChildActive ? base.subitemActive : `${base.sub} ${base.subitemHover}`}
                      `}
                    >
                      <ChildIcon size={14} className="shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      return (
        <Link
          key={item.path}
          to={item.path}
          onClick={() => setIsOpen(false)}
          className={`
            flex items-center
            ${showLabels ? "gap-3 px-3 py-2.5" : "justify-center px-0 py-0"}
            rounded-2xl transition-colors duration-150
            ${isActive ? base.activeBg : `${base.sub} ${base.hover}`}
          `}
        >
          <div
            className={`${showLabels ? "h-6 w-6" : "h-12 w-full"} flex items-center justify-center shrink-0`}
          >
            <item.icon className="text-[15px]" />
          </div>
          {showLabels && (
            <span className="truncate text-sm font-bold">{item.label}</span>
          )}
        </Link>
      );
    };

    return (
      <>
        {/* Mobile overlay — dims the page behind the open drawer */}
        <div
          aria-hidden="true"
          className={`
            fixed inset-0 z-20 lg:hidden
            transition-opacity duration-300
            ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
            ${base.overlay}
          `}
          onClick={() => setIsOpen(false)}
        />

        {/* Desktop spacer — keeps the flex layout from collapsing under the fixed sidebar */}
        <div
          aria-hidden="true"
          className={`hidden shrink-0 transition-[width] duration-300 ease-out lg:block ${
            expanded ? "w-[236px]" : "w-[64px]"
          }`}
        />

        {/* Sidebar / mobile off-canvas drawer */}
        <aside
          className={`
            fixed inset-y-0 z-30
            ${isRtl ? "right-0" : "left-0"}
            w-[280px] ${expanded ? "lg:w-[236px]" : "lg:w-[64px]"}
            transition-transform duration-300 ease-out
            lg:translate-x-0
            ${isOpen
              ? "translate-x-0"
              : isRtl
                ? "translate-x-full"
                : "-translate-x-full"
            }
            ${base.bg} ${isRtl ? "border-l" : "border-r"} ${base.border}
            flex h-screen flex-col overflow-visible
          `}
          dir={isRtl ? "rtl" : "ltr"}
        >
          {/* Desktop expand/collapse toggle */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={`
              absolute top-[30px] z-50 hidden lg:flex
              h-9 w-9 items-center justify-center
              rounded-full border-2 border-white bg-[#07111F] text-white
              shadow-[0_10px_24px_rgba(2,6,23,0.38)] transition-transform hover:scale-105
              ${isRtl ? "-left-[18px]" : "-right-[18px]"}
            `}
            aria-label={expanded ? t("nav.collapseSidebar") : t("nav.expandSidebar")}
            aria-expanded={expanded}
            title={expanded ? t("nav.collapseSidebar") : t("nav.expandSidebar")}
          >
            <FiChevronRight
              className={`h-4 w-4 transition-transform ${
                expanded
                  ? isRtl ? "" : "rotate-180"
                  : isRtl ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Logo + mobile close button */}
          <div className="flex items-center justify-between px-3 pb-5 pt-6">
            <Link
              to={ROUTES.DASHBOARD}
              className={`flex items-center min-w-0 ${
                showLabels ? "flex-1 gap-3 px-2" : "justify-center w-full"
              }`}
              onClick={() => setIsOpen(false)}
            >
              <div className="w-10 h-10 overflow-hidden rounded-2xl flex items-center justify-center shrink-0 bg-slate-950 ring-1 ring-sky-300/20">
                <img
                  src={BRAND_LOGO_SRC}
                  alt="AXIA Fleet Manager"
                  className="h-full w-full object-cover"
                />
              </div>
              {showLabels && (
                <div className="min-w-0">
                  <p className="truncate text-xs font-black uppercase tracking-[0.18em] text-white">
                    Smart Axia
                  </p>
                  <p className="truncate text-[11px] font-bold text-sky-400">
                    {t("brand.fleetManager")}
                  </p>
                </div>
              )}
            </Link>

            {/* X button — mobile only */}
            {showLabels && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`lg:hidden p-1.5 rounded-lg shrink-0 text-slate-400 ${
                  dark ? "hover:bg-slate-800" : "hover:bg-slate-700"
                }`}
                aria-label={t("header.closeMenu")}
              >
                <FiX className="text-base" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-2 py-3">
            <div className="space-y-3">
              {menuItems.map((item) => renderNavItem(item))}
            </div>
          </nav>

          {/* User avatar */}
          <div
            className={`px-3 pb-5 pt-3 shrink-0 flex ${
              showLabels
                ? "justify-start [&_p:first-child]:!text-slate-100 [&_p:last-child]:!text-slate-400"
                : "justify-center"
            }`}
          >
            <UserAvatar compact={!showLabels} />
          </div>
        </aside>
      </>
    );
  },
);

export default Sidebar;
