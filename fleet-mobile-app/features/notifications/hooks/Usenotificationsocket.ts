import { useEffect, useRef, useCallback } from 'react';
import { io, Socket }                   from 'socket.io-client';
import { useDispatch, useSelector }     from 'react-redux';
import {
  addNotification,
  setUnreadCount,
  markAsRead as markAsReadAction,
  markAllAsRead as markAllAsReadAction,
} from '@/store/slices/Notificationslice';
import type { RootState }       from '@/store';
import type { Notification }    from '../types/notification.types';

const SOCKET_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

interface UseNotificationSocketOptions {
  /** JWT token for socket authentication */
  token: string | null;
  /** Called when a new notification arrives */
  onNew?: (notification: Notification) => void;
}

export function useNotificationSocket({ token, onNew }: UseNotificationSocketOptions) {
  const dispatch     = useDispatch();
  const socketRef    = useRef<Socket | null>(null);
  const isConnected  = useRef(false);

  // ── Connect ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth:       { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay:    2_000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      isConnected.current = true;
      console.log('[Socket] Connected');
      // Request unread count on connect
      socket.emit('notification:get_count');
    });

    socket.on('disconnect', (reason) => {
      isConnected.current = false;
      console.warn('[Socket] Disconnected:', reason);
    });

    // ── Fleet notification events ────────────────────────────────────────────
    socket.on('notification:new', (notification: Notification) => {
      dispatch(addNotification(notification));
      onNew?.(notification);
    });

    socket.on('notification:count', ({ count }: { count: number }) => {
      dispatch(setUnreadCount(count));
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, dispatch, onNew]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const markAsRead = useCallback((notificationId: string) => {
    socketRef.current?.emit('notification:mark_read', { notificationId });
    dispatch(markAsReadAction(notificationId));
  }, [dispatch]);

  const markAllAsRead = useCallback((group?: string) => {
    socketRef.current?.emit('notification:mark_all_read', { group });
    dispatch(markAllAsReadAction(group));
  }, [dispatch]);

  return {
    isConnected: isConnected.current,
    markAsRead,
    markAllAsRead,
  };
}