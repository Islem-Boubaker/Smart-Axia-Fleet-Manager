import { memo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import NotificationPopup, { type Notification as PopupNotification } from '../../NotificationPopup';
import { useNotificationSocket } from '../../../hooks/useNotificationSocket';
import type { NotificationRecord } from '../../../services/notification.api';
import {
  buildMaintenancePrefillUrlFromAlert,
  isMaintenanceDocumentAlert,
} from '../../../../features/maintenance/utils/maintenancePrefill';

const toNotificationRecord = (notification: PopupNotification): NotificationRecord => ({
  id: notification.id,
  userId: '',
  type: notification.notificationType || notification.type,
  group: notification.group || notification.type,
  priority: notification.priority || 'medium',
  title: notification.title,
  message: notification.message,
  entityType: notification.entityType,
  entityId: notification.entityId,
  actionUrl: notification.actionUrl,
  metadata: notification.metadata,
  read: notification.read,
  readAt: null,
  isArchived: false,
  createdAt: notification.createdAt || new Date().toISOString(),
  updatedAt: notification.updatedAt || notification.createdAt || new Date().toISOString(),
});

export const HeaderNotifications = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading, error } = useNotificationSocket();
  const bellRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  const handleNotificationClick = async (notification: PopupNotification) => {
    try {
      if (!notification.read) {
        await markAsRead(notification.id);
      }
    } catch {
      // Navigation should still work if the read-sync fails.
    }

    const record = toNotificationRecord(notification);
    setIsOpen(false);

    if (isMaintenanceDocumentAlert(record)) {
      navigate(record.actionUrl || buildMaintenancePrefillUrlFromAlert(record));
      return;
    }

    if (record.actionUrl?.startsWith('/')) {
      navigate(record.actionUrl);
    }
  };

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
          <span className="absolute top-1 end-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
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
        onNotificationClick={handleNotificationClick}
        onMarkAllAsRead={markAllAsRead}
        triggerRef={bellRef}
      />
    </div>
  );
});
