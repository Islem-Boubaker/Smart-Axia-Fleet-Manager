import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { io, type Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { buildCookieHeader } from "@/shared/services/cookieJar";
import { toast } from "@/shared/components/toast";
import type { RawNotification } from "../types/notification.types";
import { resolveApiBaseUrl } from "@/shared/utils/apiBase";

const SOCKET_URL = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);

function getKnownNotificationText(notification: RawNotification, t: (key: string) => string) {
  const signal = [
    notification.type,
    notification.group,
    notification.title,
    notification.message,
  ].join(" ").toLowerCase();

  if (signal.includes("reclamation_submitted") || signal.includes("reclamation submitted")) {
    return {
      title: t("notifications.types.reclamationSubmitted.title"),
      message: t("notifications.types.reclamationSubmitted.body"),
    };
  }

  if (signal.includes("trip_assigned") || signal.includes("new trip assigned") || signal.includes("trip assigned")) {
    return {
      title: t("notifications.types.newTripAssigned.title"),
      message: t("notifications.types.newTripAssigned.body"),
    };
  }

  return {
    title: notification.title || t("notifications.types.generic.title"),
    message: notification.message,
  };
}

export function useRealtimeNotificationToasts() {
  const { t } = useTranslation();
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

        const text = getKnownNotificationText(notification, t);
        toast.info(text.message, {
          title: text.title,
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
  }, [isAuthenticated, t]);
}
