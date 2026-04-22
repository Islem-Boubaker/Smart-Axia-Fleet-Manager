import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from "socket.io-client";
import notificationApi from "../../features/notifications/services/notification.api";
import type { NotificationRecord } from "../../features/notifications/services/notification.api";
import { toast } from "../components";
import { queryKeys } from '../services/queryKeys';

export interface HeaderNotificationItem {
  id: string;
  type: "maintenance" | "driver" | "vehicle" | "warning" | "success";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface UseNotificationSocketOptions {
  token?: string | null;
}

function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";
  return raw.replace(/\/+$/, "");
}

function toHeaderType(notification: NotificationRecord): HeaderNotificationItem["type"] {
  if (notification.group === "maintenance") return "maintenance";
  if (notification.group === "driver") return "driver";
  if (notification.group === "trip") return "vehicle";
  if (notification.priority === "high" || notification.priority === "critical") return "warning";
  return "success";
}

function toHeaderNotification(notification: NotificationRecord): HeaderNotificationItem {
  return {
    id: notification.id,
    type: toHeaderType(notification),
    title: notification.title,
    message: notification.message,
    timestamp: new Date(notification.createdAt).toLocaleString(),
    read: Boolean(notification.read || notification.readAt),
  };
}

function extractNotifications(payload: unknown): NotificationRecord[] {
  if (Array.isArray(payload)) return payload as NotificationRecord[];
  if (payload && typeof payload === 'object') {
    const response = payload as { notifications?: unknown; items?: unknown; data?: unknown };
    if (Array.isArray(response.notifications)) return response.notifications as NotificationRecord[];
    if (Array.isArray(response.items)) return response.items as NotificationRecord[];
    if (Array.isArray(response.data)) return response.data as NotificationRecord[];
  }
  return [];
}

export function useNotificationSocket({ token }: UseNotificationSocketOptions = {}) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const shownToastIdsRef = useRef<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications.list({ limit: 20 }),
    queryFn: () => notificationApi.getAll({ limit: 20 }),
    staleTime: 60 * 1000,
  });

  const items = useMemo(
    () => extractNotifications(notificationsQuery.data),
    [notificationsQuery.data]
  );

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read && !item.readAt).length,
    [items]
  );

  useEffect(() => {
    const socket = io(resolveApiBaseUrl(), {
      auth: token ? { token } : undefined,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("notification:get_count");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("notification:new", (notification: NotificationRecord) => {
      queryClient.setQueryData(queryKeys.notifications.list({ limit: 20 }), (old: unknown) => {
        const previousItems = extractNotifications(old);
        if (previousItems.some((item) => item.id === notification.id)) {
          return old;
        }

        return [notification, ...previousItems];
      });

      if (!shownToastIdsRef.current.has(notification.id)) {
        shownToastIdsRef.current.add(notification.id);
        toast.info(notification.message, {
          title: notification.title,
          duration: 5000,
        });
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    });

    socket.on("notification:count", ({ count }: { count: number }) => {
      queryClient.setQueryData(queryKeys.notifications.unreadCount(), { count });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [queryClient, token]);

  const notifications = useMemo(() => items.map(toHeaderNotification), [items]);

  const markAsRead = useCallback(async (id: string) => {
    queryClient.setQueryData(queryKeys.notifications.list({ limit: 20 }), (old: unknown) => {
      const previousItems = extractNotifications(old);
      return previousItems.map((item) =>
        item.id === id
          ? { ...item, read: true, readAt: item.readAt ?? new Date().toISOString() }
          : item
      );
    });
    socketRef.current?.emit("notification:mark_read", { notificationId: id });
    await notificationApi.markAsRead(id);
    await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  }, [queryClient]);

  const markAllAsRead = useCallback(async () => {
    queryClient.setQueryData(queryKeys.notifications.list({ limit: 20 }), (old: unknown) => {
      const previousItems = extractNotifications(old);
      return previousItems.map((item) => ({
        ...item,
        read: true,
        readAt: item.readAt ?? new Date().toISOString(),
      }));
    });
    socketRef.current?.emit("notification:mark_all_read", {});
    await notificationApi.markAllAsRead();
    await queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  }, [queryClient]);

  return {
    notifications,
    unreadCount,
    loading: notificationsQuery.isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
  };
}

export default useNotificationSocket;
