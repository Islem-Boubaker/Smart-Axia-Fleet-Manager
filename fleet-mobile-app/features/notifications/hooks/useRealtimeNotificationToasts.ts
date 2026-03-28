import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { buildCookieHeader } from "@/shared/services/cookieJar";
import { toast } from "@/shared/components/toast";
import type { RawNotification } from "../types/notification.types";
import { resolveApiBaseUrl } from "@/shared/utils/apiBase";

const SOCKET_URL = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);

export function useRealtimeNotificationToasts() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const socketRef = useRef<Socket | null>(null);
  const shownToastIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      shownToastIdsRef.current.clear();
      return;
    }

    let socket: Socket | null = null;
    let mounted = true;

    async function connect() {
      const cookieHeader = await buildCookieHeader();
      if (!mounted) return;

      socket = io(SOCKET_URL, {
        extraHeaders: cookieHeader ? { cookie: cookieHeader } : undefined,
        transports: ["websocket"],
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1200,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        socket?.emit("notification:get_count");
      });

      socket.on("notification:new", (notification: RawNotification) => {
        if (shownToastIdsRef.current.has(notification.id)) return;

        shownToastIdsRef.current.add(notification.id);
        if (shownToastIdsRef.current.size > 200) {
          shownToastIdsRef.current.clear();
          shownToastIdsRef.current.add(notification.id);
        }

        toast.info(notification.message, {
          title: notification.title || "New Notification",
          duration: 5000,
        });
      });
    }

    connect();

    return () => {
      mounted = false;
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [isAuthenticated]);
}
