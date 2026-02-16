import { Link, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiTruck,
  FiUsers,
  FiMapPin,
  FiTool,
  FiBarChart2,
  FiSettings,
  FiX,
} from 'react-icons/fi';
import { ROUTES } from '../../utils/constants';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const location = useLocation();

  const menuItems = [
    { icon: FiHome, label: 'Dashboard', path: ROUTES.DASHBOARD },
    { icon: FiTruck, label: 'Vehicles', path: ROUTES.VEHICLES },
    { icon: FiUsers, label: 'Drivers', path: ROUTES.DRIVERS },
    { icon: FiMapPin, label: 'Trips', path: ROUTES.TRIPS },
    { icon: FiTool, label: 'Maintenance', path: ROUTES.MAINTENANCE },
    { icon: FiBarChart2, label: 'Reports', path: ROUTES.REPORTS },
    { icon: FiSettings, label: 'Settings', path: ROUTES.SETTINGS },
  ];

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
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FiTruck className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">AXIA Fleet</h2>
                <p className="text-xs text-gray-500">Manager</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="text-xl" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                BG
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  Bedis Ghodbane
                </p>
                <p className="text-xs text-gray-500 truncate">Admin</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
