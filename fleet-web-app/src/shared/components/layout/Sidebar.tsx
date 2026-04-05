import { memo, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import UserAvatar from "../ui/UserAvatar";
import {
  FiHome,
  FiTruck,
  FiUsers,
  FiMapPin,
  FiTool,
  FiBarChart2,
  FiSettings,
  FiX,
} from "react-icons/fi";
import { ROUTES } from "../../../utils/constants";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  dark?: boolean;
}

export const Sidebar = memo(({ isOpen, setIsOpen, dark = false }: SidebarProps) => {
  const location = useLocation();

  const menuItems = useMemo(
    () => [
      { icon: FiHome, label: "Dashboard", path: ROUTES.DASHBOARD },
      { icon: FiTruck, label: "Vehicles", path: ROUTES.VEHICLES },
      { icon: FiUsers, label: "Drivers", path: ROUTES.DRIVERS },
      { icon: FiMapPin, label: "Trips", path: ROUTES.TRIPS },
      { icon: FiTool, label: "Maintenance", path: ROUTES.MAINTENANCE },
      { icon: FiBarChart2, label: "Reports", path: ROUTES.REPORTS },
      { icon: FiSettings, label: "Settings", path: ROUTES.SETTINGS },
    ],
    [],
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-[260px] lg:w-64 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${
          dark
            ? "lg:border-r lg:border-slate-700/80 lg:bg-slate-900/40 lg:backdrop-blur-xl"
            : "lg:border-r lg:border-white/40 lg:bg-white/55 lg:backdrop-blur-xl lg:shadow-glass"
        } bg-white/95 backdrop-blur-xl border-r border-slate-200/80 shadow-soft lg:shadow-none`}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Logo */}
          <div
            className={`flex items-center justify-between p-5 lg:p-6 border-b ${
              dark ? "border-slate-700/80" : "border-slate-200/80"
            }`}
          >
            <Link to={ROUTES.DASHBOARD} className="flex items-center gap-3 min-w-0" onClick={() => setIsOpen(false)}>
              <div className="w-11 h-11 rounded-2xl bg-brand-light flex items-center justify-center shrink-0 ring-1 ring-brand/10">
                <FiTruck className="text-brand-deep w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className={`text-sm font-extrabold tracking-wide truncate ${dark ? "text-white" : "text-slate-900"}`}>
                  SMART AXIA
                </h2>
                <p className="text-xs font-semibold text-brand truncate">Fleet Manager</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={`lg:hidden p-2 rounded-xl shrink-0 ${dark ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"}`}
              aria-label="Close menu"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 lg:p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive
                          ? dark
                            ? "bg-brand/15 text-brand font-semibold shadow-sm"
                            : "bg-brand-light text-brand-deep font-semibold shadow-sm ring-1 ring-brand/10"
                          : dark
                            ? "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                            : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                      }`}
                    >
                      <Icon
                        className={`text-lg shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                          isActive ? "text-brand" : ""
                        }`}
                      />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div
            className={`p-4 border-t shrink-0 ${dark ? "border-slate-700/80 bg-slate-900/30" : "border-slate-200/80 bg-white/30"}`}
          >
            <UserAvatar />
          </div>
        </div>
      </aside>
    </>
  );
});
