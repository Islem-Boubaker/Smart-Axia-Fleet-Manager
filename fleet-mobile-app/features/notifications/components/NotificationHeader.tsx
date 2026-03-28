import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector }            from 'react-redux';
import { Bell, Check, CheckCheck, X, Archive } from 'lucide-react';
import { useNotification }               from '../hooks/useNotification';
import { fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead, removeNotification,selectNotifications, selectUnreadCount  } from '@/store/slices/Notificationslice';
import { notificationApi }                     from '../services/notification.api';
import type { Notification }                   from '../types/notification.types';
import { GROUP_CONFIG, PRIORITY_CONFIG }       from '../types/notification.types';
import type { RootState, AppDispatch }         from '@/store';

const MAX_DISPLAY = 8;

export function HeaderNotifications() {
  const dispatch    = useDispatch<AppDispatch>();
  const token       = useSelector((s) => (s as RootState).auth.token);
  const userId      = useSelector((s) => (s as RootState).auth.user?.id);
  const items       = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);

  const [open,         setOpen]         = useState(false);
  const [activeGroup,  setActiveGroup]  = useState<string>('all');
  const [shaking,      setShaking]      = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Socket connection ──────────────────────────────────────────────────────
  const { isConnected } = useNotification ({
    token,
    onNew: () => {
      // Shake bell on new notification
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    },
  });

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      dispatch(fetchNotifications({ limit: '20' }));
      dispatch(fetchUnreadCount());
    }
  }, [token]);

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = items
    .filter((n) => activeGroup === 'all' || n.group === activeGroup)
    .slice(0, MAX_DISPLAY);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleMarkRead = async (id: string) => {
    dispatch(markAsRead(id));
    await notificationApi.markAsRead(id);
  };

  const handleMarkAllRead = async () => {
    dispatch(markAllAsRead(activeGroup !== 'all' ? activeGroup : undefined));
    await notificationApi.markAllAsRead(activeGroup !== 'all' ? activeGroup : undefined);
  };

  const handleArchive = async (id: string) => {
    dispatch(removeNotification(id));
    await notificationApi.archive(id);
  };

  const GROUPS = ['all', 'trip', 'maintenance', 'ai', 'driver', 'system'] as const;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative p-2 rounded-lg hover:bg-gray-100 transition-colors ${shaking ? 'animate-bounce' : ''}`}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {/* Connection dot */}
        <span className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-300'}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Group filter tabs */}
          <div className="flex overflow-x-auto border-b border-gray-100 px-2 py-1.5 gap-1 scrollbar-hide">
            {GROUPS.map((g) => {
              const cfg = g !== 'all' ? GROUP_CONFIG[g] : null;
              return (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeGroup === g
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cfg ? `${cfg.icon} ${cfg.label}` : 'All'}
                </button>
              );
            })}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              filtered.map((n) => <NotificationItem key={n.id} notification={n} onRead={handleMarkRead} onArchive={handleArchive} />)
            )}
          </div>

          {/* Footer */}
          {items.length > MAX_DISPLAY && (
            <div className="border-t border-gray-100 p-3 text-center">
              <a href="/notifications" className="text-sm text-blue-600 hover:underline font-medium">
                View all {items.length} notifications →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Notification Item ─────────────────────────────────────────────────────────
function NotificationItem({
  notification: n,
  onRead,
  onArchive,
}: {
  notification: Notification;
  onRead:    (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const cfg      = GROUP_CONFIG[n.group];
  const priCfg   = PRIORITY_CONFIG[n.priority];
  const isUnread = !n.read_at;

  return (
    <div
      className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group ${isUnread ? 'bg-blue-50/40' : ''}`}
      onClick={() => isUnread && onRead(n.id)}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base"
        style={{ backgroundColor: cfg.bgColor }}
      >
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-snug truncate ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
            {n.title}
          </p>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Priority badge */}
            {(n.priority === 'high' || n.priority === 'critical') && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: priCfg.color + '20', color: priCfg.color }}
              >
                {n.priority.toUpperCase()}
              </span>
            )}
            {/* Unread dot */}
            {isUnread && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
        <p className="text-[11px] text-gray-400 mt-1">
          {new Date(n.created_at).toLocaleString()}
        </p>
      </div>

      {/* Actions (show on hover) */}
      <div className="opacity-0 group-hover:opacity-100 flex flex-col gap-1 transition-opacity">
        {isUnread && (
          <button
            onClick={(e) => { e.stopPropagation(); onRead(n.id); }}
            title="Mark as read"
            className="p-1 text-blue-500 hover:text-blue-700"
          >
            <Check size={14} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onArchive(n.id); }}
          title="Archive"
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <Archive size={14} />
        </button>
      </div>
    </div>
  );
}