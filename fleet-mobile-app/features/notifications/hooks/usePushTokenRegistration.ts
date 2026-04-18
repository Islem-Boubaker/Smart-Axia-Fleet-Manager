import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useSelector } from "react-redux";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import type { RootState } from "@/store";
import { notificationApi } from "../services/notification.api";

type ExpoProjectConfig = {
  easConfig?: { projectId?: string };
  expoConfig?: { extra?: { eas?: { projectId?: string } } };
};

function resolveProjectId(): string | undefined {
  const config = Constants as unknown as ExpoProjectConfig;
  return config.easConfig?.projectId ?? config.expoConfig?.extra?.eas?.projectId;
}

async function getPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  if (!Device.isDevice) {
    console.warn("[PushRegistration] Skipped: physical device required.");
    return null;
  }

  const permission = await Notifications.getPermissionsAsync();
  let status = permission.status;

  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== "granted") {
    console.warn("[PushRegistration] Skipped: notification permission not granted.");
    return null;
  }

  const projectId = resolveProjectId();
  const tokenResult = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  return tokenResult?.data || null;
}

export function usePushTokenRegistration() {
  const user = useSelector((state: RootState) => state.auth.user);
  const attemptedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      attemptedForUserRef.current = null;
      return;
    }

    if (attemptedForUserRef.current === String(user.id)) return;
    attemptedForUserRef.current = String(user.id);

    const run = async () => {
      try {
        const token = await getPushToken();
        if (!token) return;

        await notificationApi.registerPushToken(String(user.id), token);
        console.log("[PushRegistration] Token synced to backend for user", user.id);
      } catch (error) {
        console.error("[PushRegistration] Failed to sync token:", error);
      }
    };

    void run();
  }, [user?.id]);
}
