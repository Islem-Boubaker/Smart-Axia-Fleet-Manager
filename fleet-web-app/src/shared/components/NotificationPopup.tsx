import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiX,
  FiCheck,
  FiAlertCircle,
  FiInfo,
  FiTruck,
  FiUsers,
  FiTool,
  FiBell,
} from 'react-icons/fi';
import { localizeNotificationText } from '../utils/localizeNotification';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'maintenance' | 'driver' | 'vehicle';
  notificationType?: string;
  group?: string;
  priority?: string;
  title: string;
  message: string;
  timestamp: string;
  createdAt?: string;
  updatedAt?: string;
  actionUrl?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  read: boolean;
}

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  loading?: boolean;
  error?: string | null;
  onMarkAsRead?: (id: string) => void;
  onNotificationClick?: (notification: Notification) => void;
  onMarkAllAsRead?: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

/* ─────────────────────────────────────────────
   useMediaQuery hook (inline – no extra file needed)
───────────────────────────────────────────── */
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const getIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':     return <FiCheck        className="text-green-600  dark:text-green-400"  />;
    case 'warning':     return <FiAlertCircle  className="text-amber-600  dark:text-amber-400"  />;
    case 'maintenance': return <FiTool         className="text-orange-600 dark:text-orange-400" />;
    case 'driver':      return <FiUsers        className="text-blue-600   dark:text-blue-400"   />;
    case 'vehicle':     return <FiTruck        className="text-purple-600 dark:text-purple-400" />;
    default:            return <FiInfo         className="text-blue-600   dark:text-blue-400"   />;
  }
};

const getIconBg = (type: Notification['type']) => {
  switch (type) {
    case 'success':     return 'bg-green-100  dark:bg-green-900/30';
    case 'warning':     return 'bg-amber-100  dark:bg-amber-900/30';
    case 'maintenance': return 'bg-orange-100 dark:bg-orange-900/30';
    case 'driver':      return 'bg-blue-100   dark:bg-blue-900/30';
    case 'vehicle':     return 'bg-purple-100 dark:bg-purple-900/30';
    default:            return 'bg-blue-100   dark:bg-blue-900/30';
  }
};

/* ─────────────────────────────────────────────
   Shared notification row
───────────────────────────────────────────── */
const NotificationItem = ({
  notification,
  onMarkAsRead,
  onNotificationClick,
  locale,
}: {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onNotificationClick?: (notification: Notification) => void;
  locale: string;
}) => {
  const { t } = useTranslation();
  const localized = localizeNotificationText(
    {
      type: notification.notificationType || notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
    },
    t,
    locale
  );

  return (
    <div
      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${
        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      onClick={() => {
        if (onNotificationClick) {
          onNotificationClick(notification);
          return;
        }
        onMarkAsRead?.(notification.id);
      }}
    >
      <div className="flex gap-3">
        <div
          className={`flex-shrink-0 w-10 h-10 ${getIconBg(notification.type)} rounded-full flex items-center justify-center`}
        >
          {getIcon(notification.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">
              {localized.title}
            </p>
            {!notification.read && (
              <span className="flex-shrink-0 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-1" />
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">
            {localized.message}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {notification.timestamp}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Empty state
───────────────────────────────────────────── */
const EmptyState = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <FiBell className="text-gray-300 dark:text-slate-600 text-5xl mb-3" />
      <p className="text-gray-500 dark:text-gray-400 text-sm">{t('shared.notifications.empty')}</p>
    </div>
  );
};

const LoadingState = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin mb-3" />
      <p className="text-gray-500 dark:text-gray-400 text-sm">{t('shared.notifications.loading')}</p>
    </div>
  );
};

const ErrorState = ({ message }: { message: string }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <FiAlertCircle className="text-red-400 dark:text-red-300 text-4xl mb-3" />
      <p className="text-gray-700 dark:text-gray-200 text-sm font-medium">{t('shared.notifications.errorTitle')}</p>
      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 max-w-[260px]">{message}</p>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export const NotificationPopup = ({
  isOpen,
  onClose,
  notifications,
  loading = false,
  error = null,
  onMarkAsRead,
  onNotificationClick,
  onMarkAllAsRead,
  triggerRef,
}: NotificationPopupProps) => {
  const { t, i18n } = useTranslation();
  const popupRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const isRtl = (i18n.language || 'en').split('-')[0] === 'ar';

  // Animation state: drive slide-in AFTER mount
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Tiny delay so the browser paints the off-screen position first
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    } else {
      const id = requestAnimationFrame(() => setVisible(false));
      return () => cancelAnimationFrame(id);
    }
  }, [isOpen]);

  // ── Desktop: close on outside click ──────────────────────────────
  useEffect(() => {
    if (!isOpen || isMobile) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const outsidePopup   = popupRef.current && !popupRef.current.contains(target);
      const outsideTrigger = triggerRef?.current ? !triggerRef.current.contains(target) : true;
      if (outsidePopup && outsideTrigger) onClose();
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, isMobile, onClose, triggerRef]);

  // ── ESC key ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // ── Lock body scroll on mobile ────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen, isMobile]);

  // ── Swipe-to-close (mobile) ───────────────────────────────────────
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (delta < -60) onClose(); // swipe up → close
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!isOpen) return null;

  const renderList = () => {
    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;
    if (notifications.length === 0) return <EmptyState />;

    return notifications.map((n) => (
      <NotificationItem
        key={n.id}
        notification={n}
        onMarkAsRead={onMarkAsRead}
        onNotificationClick={onNotificationClick}
        locale={i18n.language || 'en'}
      />
    ));
  };

  /* ── Desktop dropdown ─────────────────────────────────────────── */
  const DesktopDropdown = (
    <div
      ref={popupRef}
      className="
        hidden lg:flex
        absolute mt-2
        w-[380px] max-w-[calc(100vw-2rem)]
        bg-white dark:bg-gray-900
        rounded-xl shadow-2xl
        border border-gray-200 dark:border-gray-700
        z-50
        max-h-[600px]
        flex-col
        min-h-0
        animate-[scaleIn_0.15s_ease-out]
      "
      style={{
        boxShadow: '0 20px 60px -10px rgba(0,0,0,0.2)',
        ...(isRtl ? { left: 0, transformOrigin: 'top left' } : { right: 0, transformOrigin: 'top right' }),
      }}
    >
      {/* Sticky header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-t-xl">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('shared.notifications.title')}</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('shared.notifications.unread', { count: unreadCount })}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && onMarkAllAsRead && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
            >
              {t('shared.notifications.markAllRead')}
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={t('shared.notifications.closeAria')}
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 min-h-0 divide-y divide-gray-100 dark:divide-gray-800">
        {renderList()}
      </div>
    </div>
  );

  /* ── Mobile full-screen modal ─────────────────────────────────── */
  const MobileModal = (
    <div className="lg:hidden overflow-hidden">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel – slides in from the top */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('shared.notifications.dialogAria')}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`
          fixed inset-0 z-[9999] w-full h-full
          bg-white dark:bg-slate-900
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${visible ? 'translate-y-0' : '-translate-y-full'}
        `}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('shared.notifications.title')}</h2>
            {unreadCount > 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('shared.notifications.unread', { count: unreadCount })}</p>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('shared.notifications.allCaughtUp')}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && onMarkAllAsRead && (
              <button
                onClick={onMarkAllAsRead}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
              >
                {t('shared.notifications.markAllRead')}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={t('shared.notifications.closeAria')}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Swipe hint bar */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-200 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Scrollable list */}
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
          {renderList()}
        </div>
      </div>
    </div>
  );

  const mobilePortalTarget = typeof document !== 'undefined' ? document.body : null;

  return (
    <>
      {DesktopDropdown}
      {mobilePortalTarget ? createPortal(MobileModal, mobilePortalTarget) : MobileModal}
    </>
  );
};

export default NotificationPopup;
