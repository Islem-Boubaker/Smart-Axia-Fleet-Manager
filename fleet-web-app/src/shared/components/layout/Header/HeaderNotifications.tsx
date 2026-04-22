import { memo, useState, useRef } from 'react';
import { FiBell } from 'react-icons/fi';
import NotificationPopup from '../../NotificationPopup';
import { useNotificationSocket } from '../../../hooks/useNotificationSocket';

export const HeaderNotifications = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading, error } = useNotificationSocket();
  const bellRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative">
      <button
        ref={bellRef}
        onClick={() => setIsOpen(prev => !prev)}
        className="
          relative p-2 rounded-lg
          text-gray-500 hover:text-gray-700 hover:bg-gray-100
          dark:text-slate-400 dark:hover:bg-slate-800
        "
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
        loading={loading}
        error={error}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        triggerRef={bellRef}
      />
    </div>
  );
});