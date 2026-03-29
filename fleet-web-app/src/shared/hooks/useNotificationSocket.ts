import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import notificationApi from "../../features/notifications/services/notification.api";
import type { NotificationRecord } from "../../features/notifications/services/notification.api";
import { toast } from "../components";

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

export function useNotificationSocket({ token }: UseNotificationSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const shownToastIdsRef = useRef<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    notificationApi
      .getAll({ limit: 20 })
      .then((data) => {
        if (!mounted) return;
        const notifications = data.notifications ?? [];
        setItems(notifications);
        setUnreadCount(notifications.filter((item: NotificationRecord) => !item.read && !item.readAt).length);
      })
      .catch(() => {
        if (!mounted) return;
        setItems([]);
        setUnreadCount(0);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

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
      let inserted = false;
      setItems((prev) => {
        if (prev.some((item) => item.id === notification.id)) return prev;
        inserted = true;
        return [notification, ...prev];
      });

      if (inserted && !shownToastIdsRef.current.has(notification.id)) {
        shownToastIdsRef.current.add(notification.id);
        toast.info(notification.message, {
          title: notification.title,
          duration: 5000,
        });
      }

      if (!notification.read && !notification.readAt) {
        setUnreadCount((count) => count + 1);
      }
    });

    socket.on("notification:count", ({ count }: { count: number }) => {
      setUnreadCount(count);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token]);

  const notifications = useMemo(() => items.map(toHeaderNotification), [items]);

  const markAsRead = useCallback(async (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, read: true, readAt: item.readAt ?? new Date().toISOString() }
          : item
      )
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    socketRef.current?.emit("notification:mark_read", { notificationId: id });
    await notificationApi.markAsRead(id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        read: true,
        readAt: item.readAt ?? new Date().toISOString(),
      }))
    );
    setUnreadCount(0);
    socketRef.current?.emit("notification:mark_all_read", {});
    await notificationApi.markAllAsRead();
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    isConnected,
    markAsRead,
    markAllAsRead,
  };
}

export default useNotificationSocket;
