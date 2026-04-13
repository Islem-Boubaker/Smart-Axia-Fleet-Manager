import { buildCookieHeader } from "@/shared/services/cookieJar";
import { resolveApiBaseUrl } from "@/shared/utils/apiBase";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { notificationApi } from "../services/notification.api";
import type {
    NotificationGroup,
    NotificationItem,
    NotificationType,
    RawNotification,
} from "../types/notification.types";

const SOCKET_URL = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);

function mapType(rawType: string, group: string): NotificationType {
  const t = (rawType || group || "").toLowerCase();
  if (t === "maintenance") return "alert";
  if (t === "warning") return "claim";
  if (t === "success") return "schedule";
  if (t === "trip") return "trip";
  return "admin";
}

function formatTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d
      .toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(":", ".");
  } catch (e) {
    return "00.00";
  }
}

function groupNotifications(items: RawNotification[]): NotificationGroup[] {
  const today: NotificationItem[] = [];
  const yesterday: NotificationItem[] = [];
  const older: NotificationItem[] = [];

  const now = new Date();
  const todayDate = now.toDateString();
  const yesterdayDate = new Date(now.setDate(now.getDate() - 1)).toDateString();

  items.forEach((n) => {
    const d = new Date(n.createdAt);
    const dateString = d.toDateString();

    const item: NotificationItem = {
      id: n.id,
      name: n.title,
      message: n.message,
      time: formatTime(n.createdAt),
      type: mapType(n.type, n.group),
      unread: !n.read && !n.readAt,
    };

    if (dateString === todayDate) {
      today.push(item);
    } else if (dateString === yesterdayDate) {
      yesterday.push(item);
    } else {
      older.push(item);
    }
  });

  const groups: NotificationGroup[] = [];
  if (today.length > 0) groups.push({ group: "TODAY", items: today });
  if (yesterday.length > 0)
    groups.push({ group: "YESTERDAY", items: yesterday });
  if (older.length > 0) groups.push({ group: "OLDER", items: older });

  return groups;
}

export function useNotification() {
  const [flatNotifications, setFlatNotifications] = useState<RawNotification[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef = useRef<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationApi.getAll({ limit: 50 });
      const list = Array.isArray(data)
        ? data
        : Array.isArray(
              (data as { notifications?: RawNotification[] })?.notifications,
            )
          ? (data as { notifications: RawNotification[] }).notifications
          : [];
      setFlatNotifications(list);
      setUnreadCount(
        list.filter((n: RawNotification) => !n.read && !n.readAt).length,
      );
    } catch (err) {
      console.error("Fetch errors", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    let socket: Socket | null = null;
    let mounted = true;

    async function initSocket() {
      const cookieHeader = await buildCookieHeader();
      if (!mounted) return;

      socket = io(SOCKET_URL, {
        extraHeaders: { cookie: cookieHeader },
        transports: ["websocket"],
        reconnectionAttempts: 10,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        socket?.emit("notification:get_count");
      });

      socket.on("notification:new", (notification: RawNotification) => {
        setFlatNotifications((prev) => {
          if (prev.some((n) => n.id === notification.id)) return prev;
          return [notification, ...prev];
        });

        if (!notification.read && !notification.readAt) {
          setUnreadCount((c) => c + 1);
        }
      });

      socket.on("notification:count", ({ count }: { count: number }) => {
        setUnreadCount(count);
      });
    }

    initSocket();

    return () => {
      mounted = false;
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, []);

  const markAsRead = useCallback(
    async (id: string) => {
      setFlatNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, read: true, readAt: new Date().toISOString() }
            : n,
        ),
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      socketRef.current?.emit("notification:mark_read", { notificationId: id });
      try {
        await notificationApi.markAsRead(id);
      } catch {
        fetchNotifications();
      }
    },
    [fetchNotifications],
  );

  const markAllAsRead = useCallback(async () => {
    setFlatNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() })),
    );
    setUnreadCount(0);

    socketRef.current?.emit("notification:mark_all_read");
    try {
      await notificationApi.markAllAsRead();
    } catch {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const groups = useMemo(
    () => groupNotifications(flatNotifications),
    [flatNotifications],
  );

  return {
    groups,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
