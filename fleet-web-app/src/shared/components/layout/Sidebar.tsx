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
  FiPlus,
  FiMinus,
  FiUser,
  FiBell,
  FiShield,
  FiChevronRight,
} from "react-icons/fi";
import { ROUTES } from "../../../utils/constants";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  dark?: boolean;
}

export const Sidebar = memo(
  ({ isOpen, setIsOpen, dark = false }: SidebarProps) => {
    const { t } = useTranslation();
    const location = useLocation();
    const [settingsOpen, setSettingsOpen] = useState(
      location.pathname.startsWith(ROUTES.SETTINGS),
    );
    const [expanded, setExpanded] = useState(false);

    const settingsSubItems = useMemo(
      () => [
        {
          icon: FiUser,
          label: t("settings.sidebar.profile"),
          path: `${ROUTES.SETTINGS}?tab=profile`,
          tab: "profile",
        },
        {
          icon: FiBell,
          label: t("settings.sidebar.notifications"),
          path: `${ROUTES.SETTINGS}?tab=notifications`,
          tab: "notifications",
        },
        {
          icon: FiShield,
          label: t("settings.sidebar.security"),
          path: `${ROUTES.SETTINGS}?tab=security`,
          tab: "security",
        },
      ],
      [t],
    );

    const menuItems = useMemo(
      () => [
        {
          icon: FiHome,
          label: t("nav.dashboard"),
          path: ROUTES.DASHBOARD,
          hasAdd: true,
        },
        {
          icon: FiTruck,
          label: t("nav.vehicles"),
          path: ROUTES.VEHICLES,
          hasAdd: true,
        },
        {
          icon: FiUsers,
          label: t("nav.drivers"),
          path: ROUTES.DRIVERS,
          hasAdd: true,
        },
        {
          icon: FiMapPin,
          label: t("nav.trips"),
          path: ROUTES.TRIPS,
          hasAdd: true,
        },
        {
          icon: FiTool,
          label: t("nav.maintenance"),
          path: ROUTES.MAINTENANCE,
          hasAdd: false,
        },
        {
          icon: FiBarChart2,
          label: t("nav.reports"),
          path: ROUTES.REPORTS,
          hasAdd: false,
        },
        {
          icon: FiAlertCircle,
          label: t("nav.reclamations"),
          path: ROUTES.DRIVER_ISSUES,
          hasAdd: false,
        },
        {
          icon: FiSettings,
          label: t("nav.settings"),
          path: ROUTES.SETTINGS,
          hasCollapse: true,
          children: settingsSubItems,
        },
      ],
      [t, settingsSubItems],
    );

    const primaryItems = menuItems.slice(0, 7);
    const settingsItem = menuItems[7];

    const base = dark
      ? {
          bg: "bg-[#07111F]/95",
          border: "border-cyan-200/10",
          text: "text-slate-100",
          sub: "text-slate-400",
          hover: "hover:bg-cyan-300/10 hover:text-cyan-50",
          activeBg: "bg-white text-slate-950 shadow-sm",
          overlay: "bg-slate-950/70",
          divider: "border-cyan-200/10",
          subitemHover: "hover:bg-cyan-300/10 hover:text-cyan-50",
          subitemActive: "bg-cyan-300/15 text-cyan-50 font-medium ring-1 ring-cyan-200/20",
        }
      : {
          bg: "bg-[#111827]",
          border: "border-white/10",
          text: "text-slate-800",
          sub: "text-slate-400",
          hover: "hover:bg-white/10 hover:text-white",
          activeBg: "bg-white text-slate-950",
          overlay: "bg-black/40",
          divider: "border-white/10",
          subitemHover: "hover:bg-white/10 hover:text-white",
          subitemActive: "bg-white/15 text-white font-medium",
        };

    // Helper to check if a settings sub-item is active
    const isSubItemActive = (tab: string) => {
      const searchParams = new URLSearchParams(location.search);
      return (
        location.pathname === ROUTES.SETTINGS && searchParams.get("tab") === tab
      );
    };

    return (
      <>
        {/* Mobile Overlay */}
        {isOpen && (
          <div
            className={`fixed inset-0 z-20 lg:hidden ${base.overlay}`}
            onClick={() => setIsOpen(false)}
          />
        )}

        <div
          aria-hidden="true"
          className={`hidden shrink-0 transition-[width] duration-300 ease-out lg:block ${
            expanded ? "w-[236px]" : "w-[64px]"
          }`}
        />

        {/* Sidebar */}
        <aside
          className={`
          fixed inset-y-0 left-0 z-30
          ${expanded ? "w-[236px] lg:w-[236px]" : "w-[64px] lg:w-[64px]"}
          transform transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${base.bg} border-r ${base.border}
          flex h-screen flex-col overflow-visible
        `}
        >
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="absolute -right-[18px] top-[30px] z-50 hidden h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#07111F] text-white shadow-[0_10px_24px_rgba(2,6,23,0.38)] transition-transform hover:scale-105 lg:flex"
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={expanded}
            title={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <FiChevronRight className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>

          {/* ── Logo ── */}
          <div
            className="flex items-center justify-center px-3 pb-5 pt-6"
          >
            <Link
              to={ROUTES.DASHBOARD}
              className={`flex items-center min-w-0 ${expanded ? "w-full justify-start gap-3 px-2" : "justify-center"}`}
              onClick={() => setIsOpen(false)}
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <FiTruck className="text-blue-600 w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2
                  className={`text-[13px] font-bold tracking-widest truncate uppercase ${dark ? "text-white" : "text-slate-900"}`}
                >
                  {t("brand.axia")}
                </h2>
                <p className="text-[11px] font-medium text-blue-500 truncate">
                  {t("brand.fleetManager")}
                </p>
              </div>
              {expanded && (
                <div className="min-w-0">
                  <p className="truncate text-xs font-black uppercase tracking-[0.18em] text-white">Smart Axia</p>
                  <p className="truncate text-[11px] font-bold text-sky-400">Fleet Manager</p>
                </div>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={`lg:hidden p-1.5 rounded-lg shrink-0 ${dark ? "text-slate-400 hover:bg-slate-800" : "text-slate-400 hover:bg-slate-100"}`}
              aria-label={t("header.closeMenu")}
            >
              <FiX className="text-base" />
            </button>
          </div>

          {/* ── Navigation ── */}
          <nav className="flex-1 overflow-hidden px-2 py-3">
            <div className="space-y-3">
            {primaryItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isSettingsItem = item.path === ROUTES.SETTINGS;
              const Icon = item.icon;

              return (
                <div key={item.path}>
                  {/* Nav row */}
                  {isSettingsItem ? (
                    <Link
                      to={item.path}
                      onClick={() => {
                        setSettingsOpen((o) => !o);
                      }}
                      className={`
                      group w-full flex items-center justify-between
                      px-0 py-0 rounded-2xl text-left
                      transition-colors duration-150
                      ${
                        isActive || location.pathname.startsWith(item.path)
                          ? base.activeBg
                          : `${base.sub} ${base.hover}`
                      }
                    `}
                    >
                      <div className="flex h-10 w-full items-center justify-center">
                        <Icon className="text-[15px] shrink-0" />
                      </div>
                      <span
                        className="hidden"
                      >
                        {item.label}
                      </span>
                      <span className="sr-only">{item.label}</span>
                      <span className="hidden">
                        {settingsOpen ? (
                          <FiMinus size={13} />
                        ) : (
                          <FiPlus size={13} />
                        )}
                      </span>
                    </Link>
                  ) : (
                    <Link
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`
                      group flex items-center
                      ${expanded ? "justify-start gap-3 px-3 py-2.5" : "justify-center px-0 py-0"}
                      rounded-2xl
                      transition-colors duration-150
                      ${isActive ? base.activeBg : `${base.sub} ${base.hover}`}
                    `}
                    >
                      <div className={`${expanded ? "h-6 w-6" : "h-12 w-full"} flex items-center justify-center`}>
                        <Icon className="text-[15px] shrink-0" />
                        <span className="sr-only">{item.label}</span>
                      </div>
                      {expanded && <span className="truncate text-sm font-bold">{item.label}</span>}
                    </Link>
                  )}

                  {/* Settings sub-items */}
                  {isSettingsItem && settingsOpen && item.children && (
                    <div className="mt-2 space-y-2 pb-1">
                      {item.children.map((child) => {
                        const isChildActive = isSubItemActive(child.tab);
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setIsOpen(false)}
                            className={`
                            flex h-9 items-center justify-center rounded-xl text-[13px]
                            transition-colors duration-100
                            ${
                              isChildActive
                                ? base.subitemActive
                                : `${base.sub} ${base.subitemHover}`
                            }
                          `}
                          >
                            <ChildIcon size={14} className="shrink-0" />
                            <span className="sr-only">{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            </div>

            {settingsItem ? (
              <div className="mt-8">
                {(() => {
                  const item = settingsItem;
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      to={item.path}
                      onClick={() => {
                        setSettingsOpen((o) => !o);
                      }}
                      className={`group flex w-full items-center rounded-2xl text-left transition-colors duration-150 ${
                        expanded ? "justify-start gap-3 px-3 py-2.5" : "justify-center px-0 py-0"
                      } ${
                        isActive || location.pathname.startsWith(item.path)
                          ? base.activeBg
                          : `${base.sub} ${base.hover}`
                      }`}
                    >
                      <div className={`${expanded ? "h-6 w-6" : "h-12 w-full"} flex items-center justify-center`}>
                        <Icon className="text-[15px] shrink-0" />
                      </div>
                      <span className="sr-only">{item.label}</span>
                      {expanded && <span className="truncate text-sm font-bold">{item.label}</span>}
                    </Link>
                  );
                })()}
                {expanded && settingsOpen && settingsItem.children ? (
                  <div className="mt-2 space-y-1 pl-4">
                    {settingsItem.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = isSubItemActive(child.tab);
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                            isChildActive ? base.subitemActive : `${base.sub} ${base.subitemHover}`
                          }`}
                        >
                          <ChildIcon size={13} />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </nav>

          {/* ── User Avatar ── */}
          <div
            className={`px-3 pb-5 pt-3 shrink-0 flex ${expanded ? "justify-start [&_p:first-child]:!text-slate-100 [&_p:last-child]:!text-slate-400" : "justify-center"}`}
          >
            <UserAvatar compact={!expanded} />
          </div>
        </aside>
      </>
    );
  },
);

export default Sidebar;
