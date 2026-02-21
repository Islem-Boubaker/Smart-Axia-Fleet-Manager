import { memo, useState, useCallback, useRef } from 'react';
import { FiMenu, FiBell, FiSearch } from 'react-icons/fi';
import NotificationPopup from './NotificationPopup';

interface HeaderProps {
  toggleSidebar: () => void;
}

// Mock notifications data
const mockNotifications = [
  {
    id: '1',
    type: 'maintenance' as const,
    title: 'Maintenance Due',
    message: 'Toyota Camry (123 TU 4567) is due for oil change in 2 days',
    timestamp: '5 minutes ago',
    read: false,
  },
  {
    id: '2',
    type: 'driver' as const,
    title: 'New Driver Request',
    message: 'Mohamed Ben Salah has requested time off for next week',
    timestamp: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    type: 'vehicle' as const,
    title: 'Vehicle Added',
    message: 'Ford F-150 (234 TU 8912) has been added to the fleet',
    timestamp: '3 hours ago',
    read: true,
  },
  {
    id: '4',
    type: 'warning' as const,
    title: 'High Mileage Alert',
    message: 'Honda Accord (167 TU 2389) has exceeded 60,000 km',
    timestamp: '1 day ago',
    read: true,
  },
  {
    id: '5',
    type: 'success' as const,
    title: 'Trip Completed',
    message: 'Trip from Tunis to Sfax completed successfully',
    timestamp: '2 days ago',
    read: true,
  },
];

const Header = memo(({ toggleSidebar }: HeaderProps) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const bellButtonRef = useRef<HTMLButtonElement>(null);

  const handleMarkAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4 flex-1">
          <button
            onClick={toggleSidebar}
            className="text-gray-500 hover:text-gray-700 lg:hidden"
          >
            <FiMenu className="text-2xl" />
          </button>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search vehicles, drivers, trips..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button
              ref={bellButtonRef}
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiBell className="text-xl" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            <NotificationPopup
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              triggerRef={bellButtonRef}
            />
          </div>

          {/* User Avatar */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">Bedis Ghodbane</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
              BG
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
