// import { useState, useEffect, useRef, useCallback } from "react";
// import { io, Socket } from "socket.io-client";
// import { useDispatch } from "react-redux";
// import * as Notifications from "expo-notifications";
// import * as Device from "expo-device";
// import { Platform } from "react-native";

// import {
//   addNotification,
//   setUnreadCount,
//   markAsRead as markAsReadAction,
//   markAllAsRead as markAllAsReadAction,
// } from "@/store/slices/Notificationslice";

// import { notificationApi } from "../services/notification.api";
// import type { Notification } from "../types/notification.types";

// const SOCKET_URL =
//   process.env.EXPO_PUBLIC_API_URL ??
//   "http://localhost:5000";

// interface Options {
//   userId: string | null;
//   token: string | null;
//   onNew?: (notification: Notification) => void;
// }

// function isNotificationRead(notification: Notification): boolean {
//   const readValue = (notification as Notification & { read?: boolean }).read;
//   if (typeof readValue === "boolean") return readValue;
//   return Boolean(
//     (notification as Notification & { readAt?: string | null }).readAt ??
//       (notification as Notification & { read_at?: string | null }).read_at
//   );
// }

// // ─────────────────────────────────────────────────────────────
// // Push Config
// // ─────────────────────────────────────────────────────────────
// Notifications.setNotificationHandler({
//   handleNotification: async (notification) => {
//     const priority = notification.request.content.data?.priority ?? "medium";

//     return {
//       shouldShowAlert: true,
//       shouldPlaySound: priority === "high" || priority === "critical",
//       shouldSetBadge: true,
//       shouldShowBanner: true,
//       shouldShowList: true,
//     };
//   },
// });

// // ─────────────────────────────────────────────────────────────
// // Hook
// // ─────────────────────────────────────────────────────────────
// export function useNotification({ userId, token, onNew }: Options) {
//   const dispatch = useDispatch();
//   const socketRef = useRef<Socket | null>(null);

//   const [notifications, setNotifications] = useState<Notification[]>([]);
//   const [unreadCount, setUnreadCountLocal] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [isConnected, setIsConnected] = useState(false);
//   const [pushToken, setPushToken] = useState<string | null>(null);

//   // ─────────────────────────────────────────────────────────────
//   // 1. Fetch initial data
//   // ─────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!token) return;

//     setLoading(true);

//     notificationApi
//       .getAll({ limit: 30 })
//       .then((data) => {
//         const list = data.notifications ?? [];
//         setNotifications(list);

//         const unread = list.filter((n: Notification) => !isNotificationRead(n)).length;
//         setUnreadCountLocal(unread);
//         dispatch(setUnreadCount(unread));
//       })
//       .catch(console.error)
//       .finally(() => setLoading(false));
//   }, [token, dispatch]);

//   // ─────────────────────────────────────────────────────────────
//   // 2. Register Push Token
//   // ─────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const currentUserId = userId;
//     if (typeof currentUserId !== "string" || currentUserId.length === 0) return;
//     const pushUserId: string = currentUserId;

//     async function registerPush() {
//       if (!Device.isDevice) return;

//       const { status } = await Notifications.requestPermissionsAsync();
//       if (status !== "granted") return;

//       if (Platform.OS === "android") {
//         await Notifications.setNotificationChannelAsync("default", {
//           name: "Default",
//           importance: Notifications.AndroidImportance.HIGH,
//         });
//       }

//       const tokenData = await Notifications.getExpoPushTokenAsync({
//         projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
//       });

//       if (typeof tokenData.data !== "string" || tokenData.data.length === 0) return;
//       const token: string = tokenData.data;

//       setPushToken(token);

//       await notificationApi
//         .registerPushToken(pushUserId, token)
//         .catch(console.error);
//     }

//     registerPush();
//   }, [userId]);

//   // ─────────────────────────────────────────────────────────────
//   // 3. Handle push click
//   // ─────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const sub = Notifications.addNotificationResponseReceivedListener((res) => {
//       const id = res.notification.request.content.data?.notificationId;
//       if (typeof id === "string") {
//         setNotifications((prev) =>
//           prev.map((n) =>
//             n.id === id
//               ? {
//                   ...n,
//                   readAt: new Date().toISOString(),
//                   read_at: new Date().toISOString(),
//                   read: true,
//                 }
//               : n,
//           ),
//         );

//         setUnreadCountLocal((c) => Math.max(0, c - 1));
//         dispatch(markAsReadAction(id));
//         socketRef.current?.emit("notification:mark_read", { notificationId: id });
//         notificationApi.markAsRead(id).catch(console.error);
//       }
//     });

//     return () => sub.remove();
//   }, [dispatch]);

//   // ─────────────────────────────────────────────────────────────
//   // 4. Socket connection
//   // ─────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!token) return;

//     const socket = io(SOCKET_URL, {
//       auth: { token },
//       transports: ["websocket"],
//       reconnectionAttempts: 10,
//     });

//     socketRef.current = socket;

//     socket.on("connect", () => {
//       setIsConnected(true);
//       socket.emit("notification:get_count");
//     });

//     socket.on("disconnect", () => {
//       setIsConnected(false);
//     });

//     socket.on("notification:new", (notification: Notification) => {
//       setNotifications((prev) => {
//         if (prev.some((n) => n.id === notification.id)) return prev;
//         return [notification, ...prev];
//       });

//       if (!isNotificationRead(notification)) {
//         setUnreadCountLocal((c) => c + 1);
//       }

//       dispatch(addNotification(notification));
//       onNew?.(notification);
//     });

//     socket.on("notification:count", ({ count }: { count: number }) => {
//       setUnreadCountLocal(count);
//       dispatch(setUnreadCount(count));
//     });

//     return () => {
//       socket.disconnect();
//       socketRef.current = null;
//       setIsConnected(false);
//     };
//   }, [token, dispatch, onNew]);

//   // ─────────────────────────────────────────────────────────────
//   // Actions
//   // ─────────────────────────────────────────────────────────────
//   const markAsRead = useCallback(
//     (id: string) => {
//       setNotifications((prev) =>
//         prev.map((n) =>
//           n.id === id
//             ? {
//                 ...n,
//                 readAt: new Date().toISOString(),
//                 read_at: new Date().toISOString(),
//                 read: true,
//               }
//             : n,
//         ),
//       );

//       setUnreadCountLocal((c) => Math.max(0, c - 1));
//       dispatch(markAsReadAction(id));

//       socketRef.current?.emit("notification:mark_read", {
//         notificationId: id,
//       });

//       notificationApi.markAsRead(id).catch(console.error);
//     },
//     [dispatch],
//   );

//   const markAllAsRead = useCallback(
//     (group?: string) => {
//       let remainingUnread = 0;
//       setNotifications((prev) =>
//         prev.map((n) => {
//           const shouldMark = !group || n.group === group;
//           if (!shouldMark && !isNotificationRead(n)) {
//             remainingUnread += 1;
//           }

//           if (shouldMark) {
//             return {
//               ...n,
//               readAt: new Date().toISOString(),
//               read_at: new Date().toISOString(),
//               read: true,
//             };
//           }

//           return n;
//         }),
//       );

//       setUnreadCountLocal(group ? remainingUnread : 0);
//       dispatch(markAllAsReadAction(group));

//       socketRef.current?.emit("notification:mark_all_read", { group });
//       notificationApi.markAllAsRead(group).catch(console.error);
//     },
//     [dispatch],
//   );

//   return {
//     notifications,
//     unreadCount,
//     loading,
//     isConnected,
//     pushToken,
//     markAsRead,
//     markAllAsRead,
//   };
// }
import { useState, useCallback } from 'react';
import type { NotificationGroup } from '../types/notification.types';
import { notificationApi } from '../services/notification.api';

// ─── Fallback mock data (used until API is ready) ─────────────────
const MOCK_DATA: NotificationGroup[] = [
  {
    group: 'TODAY',
    items: [
      { id: '1', name: 'Trip assigned',     message: 'Route Tunis → Sfax has been assigned to you',        time: '15.14', type: 'trip',     unread: true  },
      { id: '2', name: 'Schedule update',   message: 'Your 14:00 departure has been rescheduled to 14:30', time: '14.31', type: 'schedule', unread: true  },
      { id: '3', name: 'Reclamation',       message: 'Your vehicle damage report is under review',         time: '13.12', type: 'claim',    unread: false },
    ],
  },
  {
    group: 'YESTERDAY',
    items: [
      { id: '4', name: 'Trip completed',    message: 'Trip #1929120 marked as completed. Score: 90%',      time: '22.14', type: 'trip',     unread: false },
      { id: '5', name: 'Admin message',     message: 'Please submit your fuel log for March 14',           time: '21.31', type: 'admin',    unread: false },
      { id: '6', name: 'Maintenance alert', message: 'Vehicle Toyota 9382 is due for inspection',          time: '21.12', type: 'alert',    unread: false },
      { id: '7', name: 'Trip assigned',     message: 'New trip added to your schedule for tomorrow',       time: '20.11', type: 'trip',     unread: false },
      { id: '8', name: 'Reclamation',       message: 'Your late arrival report has been resolved',         time: '20.01', type: 'claim',    unread: false },
      { id: '9', name: 'Schedule update',   message: 'Weekly schedule for Mar 17–21 is now available',     time: '19.58', type: 'schedule', unread: false },
    ],
  },
];

export function useNotification() {
  const [groups, setGroups] = useState<NotificationGroup[]>(MOCK_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Fetch from API and replace local state */
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationApi.getAll();
      setGroups(data);
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  /** Optimistic mark-one-read */
  const markRead = useCallback(async (id: string) => {
    // Optimistic update
    setGroups(prev =>
      prev.map(g => ({
        ...g,
        items: g.items.map(item =>
          item.id === id ? { ...item, unread: false } : item
        ),
      }))
    );
    try {
      await notificationApi.markRead(id);
    } catch {
      // Revert on failure — re-fetch
      fetchNotifications();
    }
  }, [fetchNotifications]);

  /** Optimistic mark-all-read */
  const markAllRead = useCallback(async () => {
    setGroups(prev =>
      prev.map(g => ({
        ...g,
        items: g.items.map(item => ({ ...item, unread: false })),
      }))
    );
    try {
      await notificationApi.markAllRead();
    } catch {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const unreadCount = groups
    .flatMap(g => g.items)
    .filter(i => i.unread).length;

  return { groups, loading, error, unreadCount, fetchNotifications, markRead, markAllRead };
}