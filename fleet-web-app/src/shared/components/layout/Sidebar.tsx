import { memo, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
} from "react-icons/fi";
import { ROUTES } from "../../../utils/constants";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
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
  ({ isOpen, setIsOpen, dark = false }: SidebarProps) => {
    const location = useLocation();
    const [settingsOpen, setSettingsOpen] = useState(
      location.pathname.startsWith(ROUTES.SETTINGS),
    );
    const navigation = useNavigate();

    const menuItems = useMemo(
      () => [
        {
          icon: FiHome,
          label: "Dashboard",
          path: ROUTES.DASHBOARD,
          hasAdd: true,
        },
        {
          icon: FiTruck,
          label: "Vehicles",
          path: ROUTES.VEHICLES,
          hasAdd: true,
        },
        { icon: FiUsers, label: "Drivers", path: ROUTES.DRIVERS, hasAdd: true },
        { icon: FiMapPin, label: "Trips", path: ROUTES.TRIPS, hasAdd: true },
        {
          icon: FiTool,
          label: "Maintenance",
          path: ROUTES.MAINTENANCE,
          hasAdd: false,
        },
        {
          icon: FiBarChart2,
          label: "Reports",
          path: ROUTES.REPORTS,
          hasAdd: false,
        },
        {
          icon: FiAlertCircle,
          label: "Driver Issues",
          path: ROUTES.DRIVER_ISSUES,
          hasAdd: false,
        },
        {
          icon: FiSettings,
          label: "Settings",
          path: ROUTES.SETTINGS,
          hasCollapse: true,
          children: settingsSubItems,
        },
      ],
      [],
    );

    const base = dark
      ? {
          bg: "bg-slate-900",
          border: "border-slate-700/60",
          text: "text-slate-100",
          sub: "text-slate-400",
          hover: "hover:bg-slate-800/70 hover:text-white",
          activeBg: "bg-slate-800 text-white",
          overlay: "bg-slate-950/70",
          divider: "border-slate-700/60",
          subitemHover: "hover:bg-slate-800/60 hover:text-white",
          subitemActive: "bg-slate-800 text-white font-medium",
        }
      : {
          bg: "bg-white",
          border: "border-slate-100",
          text: "text-slate-800",
          sub: "text-slate-400",
          hover: "hover:bg-slate-50 hover:text-slate-900",
          activeBg: "bg-slate-100 text-slate-900",
          overlay: "bg-black/40",
          divider: "border-slate-100",
          subitemHover: "hover:bg-slate-50 hover:text-slate-800",
          subitemActive: "bg-slate-100 text-slate-900 font-medium",
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

        {/* Sidebar */}
        <aside
          className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-[240px] lg:w-[240px]
          transform transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${base.bg} border-r ${base.border}
          flex flex-col h-full
        `}
        >
          {/* ── Logo ── */}
          <div
            className={`flex items-center justify-between px-5 py-5 border-b ${base.divider}`}
          >
            <Link
              to={ROUTES.DASHBOARD}
              className="flex items-center gap-3 min-w-0"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <FiTruck className="text-blue-600 w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2
                  className={`text-[13px] font-bold tracking-widest truncate uppercase ${dark ? "text-white" : "text-slate-900"}`}
                >
                  Smart Axia
                </h2>
                <p className="text-[11px] font-medium text-blue-500 truncate">
                  Fleet Manager
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={`lg:hidden p-1.5 rounded-lg shrink-0 ${dark ? "text-slate-400 hover:bg-slate-800" : "text-slate-400 hover:bg-slate-100"}`}
              aria-label="Close menu"
            >
              <FiX className="text-base" />
            </button>
          </div>

          {/* ── Navigation ── */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isSettingsItem = item.label === "Settings";
              const Icon = item.icon;

              return (
                <div key={item.path}>
                  {/* Nav row */}
                  {isSettingsItem ? (
                    <Link
                      to={item.path}
                      type="button"
                      onClick={() => {
      
                        setSettingsOpen((o) => !o);
                      }}
                      className={`
                      group w-full flex items-center justify-between
                      px-3 py-2 rounded-lg text-left
                      transition-colors duration-150
                      ${
                        isActive || location.pathname.startsWith(item.path)
                          ? base.activeBg
                          : `${base.sub} ${base.hover}`
                      }
                    `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="text-base shrink-0" />
                        <span className="text-[13px] font-medium">
                          {item.label}
                        </span>
                      </div>
                      <span
                        className={`transition-colors ${dark ? "text-slate-600 group-hover:text-slate-400" : "text-slate-300 group-hover:text-slate-500"}`}
                      >
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
                      group flex items-center justify-between
                      px-3 py-2 rounded-lg
                      transition-colors duration-150
                      ${isActive ? base.activeBg : `${base.sub} ${base.hover}`}
                    `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="text-base shrink-0" />
                        <span className="text-[13px] font-medium">
                          {item.label}
                        </span>
                      </div>
                    </Link>
                  )}

                  {/* Settings sub-items */}
                  {isSettingsItem && settingsOpen && item.children && (
                    <div
                      className={`ml-4 mt-0.5 pl-3 border-l ${dark ? "border-slate-700/60" : "border-slate-100"} space-y-0.5 pb-1`}
                    >
                      {item.children.map((child) => {
                        const isChildActive = isSubItemActive(child.tab);
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setIsOpen(false)}
                            className={`
                            flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px]
                            transition-colors duration-100
                            ${
                              isChildActive
                                ? base.subitemActive
                                : `${base.sub} ${base.subitemHover}`
                            }
                          `}
                          >
                            <ChildIcon size={13} className="shrink-0" />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* ── User Avatar ── */}
          <div className={`px-4 py-4 border-t ${base.divider} shrink-0`}>
            <UserAvatar />
          </div>
        </aside>
      </>
    );
  },
);

export default Sidebar;
