import { memo, useMemo } from 'react';
import type { ComponentType } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiGrid,
  FiHardDrive,
  FiTool,
  FiMoon,
  FiSettings,
  FiSun,
  FiUsers,
} from 'react-icons/fi';
import { ROUTES } from '../../../../utils/constants';

type NavItem = {
  label: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
};

interface HeaderFeatureNavProps {
  dark: boolean;
  setDark: (dark: boolean) => void;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: FiGrid },
  { label: 'Drivers', path: ROUTES.DRIVERS, icon: FiUsers },
  { label: 'Vehicles', path: ROUTES.VEHICLES, icon: FiHardDrive },
  { label: 'Maintenance', path: ROUTES.MAINTENANCE, icon: FiTool },
];

export const HeaderFeatureNav = memo(({ dark, setDark }: HeaderFeatureNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const pills = useMemo(
    () =>
      navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs xl:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              isActive
                ? dark
                  ? 'bg-gray-900 text-white'
                  : 'bg-blue-600 text-white'
                : dark
                  ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title={item.label}
          >
            <Icon className="text-sm" />
            <span>{item.label}</span>
          </button>
        );
      }),
    [location.pathname, navigate],
  );

  return (
    <nav className={`flex items-center gap-1 rounded-full px-2 py-2 shadow-sm border max-w-full overflow-x-auto ${dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
      <div className={`inline-flex rounded-full p-1 gap-1 mr-1 ${dark ? 'bg-slate-800' : 'bg-gray-100'}`}>
        <button
          onClick={() => setDark(false)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            !dark ? 'bg-white text-amber-500 shadow' : 'text-gray-500'
          }`}
          title="Light mode"
        >
          <FiSun className="w-4 h-4" />
        </button>
        <button
          onClick={() => setDark(true)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            dark ? 'bg-slate-900 text-sky-300 shadow' : 'text-gray-500'
          }`}
          title="Dark mode"
        >
          <FiMoon className="w-4 h-4" />
        </button>
      </div>

      <div className="hidden 2xl:flex items-center gap-1">{pills}</div>
      <div className="flex 2xl:hidden items-center gap-1">
        {navItems.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? dark
                    ? 'bg-gray-900 text-white'
                    : 'bg-blue-600 text-white'
                  : dark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
              title={item.label}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className={`w-px h-5 mx-1 ${dark ? 'bg-slate-600' : 'bg-gray-200'}`} />

      <button
        onClick={() => navigate(ROUTES.SETTINGS)}
        className={`p-2 rounded-full transition-all duration-200 ${
          location.pathname === ROUTES.SETTINGS
            ? dark
              ? 'bg-gray-900 text-white'
              : 'bg-blue-600 text-white'
            : dark
              ? 'text-slate-300 hover:text-white hover:bg-slate-700'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
        }`}
        title="Setting"
      >
        <FiSettings className="w-4 h-4" />
      </button>
    </nav>
  );
});
