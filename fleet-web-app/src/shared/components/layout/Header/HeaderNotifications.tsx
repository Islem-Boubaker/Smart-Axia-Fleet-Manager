import { memo, useState, useCallback, useRef } from 'react';
import { FiBell } from 'react-icons/fi';
import NotificationPopup from '../../NotificationPopup';
import type { Notification } from '../../types/types';

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'maintenance',
    title: 'Maintenance Due',
    message: 'Toyota Camry is due for oil change in 2 days',
    timestamp: '5 minutes ago',
    read: false,
  },
];

export const HeaderNotifications = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const bellRef = useRef<HTMLElement>(null) as React.MutableRefObject<HTMLElement>;

  const handleMarkAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={() => setIsOpen(prev => !prev)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
      >
        <FiBell className="text-xl" />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      <NotificationPopup
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        triggerRef={bellRef}
      />
    </div>
  );
});