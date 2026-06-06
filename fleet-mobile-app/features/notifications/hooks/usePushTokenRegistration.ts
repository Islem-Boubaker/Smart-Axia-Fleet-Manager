import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useSelector } from "react-redux";
import Constants from "expo-constants";
import * as Device from "expo-device";

import type { RootState } from "@/store";
import { notificationApi } from "../services/notification.api";
import { configurePushNotifications, getExpoPushToken, requestPushPermission } from "../utils/pushNotifications";

type ExpoProjectConfig = {
  easConfig?: { projectId?: string };
  expoConfig?: { extra?: { eas?: { projectId?: string } } };
};

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidProjectId(value: string | undefined): value is string {
  return Boolean(value && UUID_V4_REGEX.test(value));
}

function resolveProjectId(): string | undefined {
  const config = Constants as unknown as ExpoProjectConfig;
  const rawProjectId =
    config.easConfig?.projectId ?? config.expoConfig?.extra?.eas?.projectId;

  if (!isValidProjectId(rawProjectId)) {
    if (rawProjectId) {
      console.warn(
        "[PushRegistration] Invalid EAS projectId in Expo config. Expected UUID format.",
      );
    }
    return undefined;
  }

  return rawProjectId;
}

async function getPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  if (Constants.executionEnvironment === "storeClient") {
    console.warn(
      "[PushRegistration] Skipped: remote push notifications are not supported in Expo Go. Use a development build.",
    );
    return null;
  }

  if (!Device.isDevice) {
    console.warn("[PushRegistration] Skipped: physical device required.");
    return null;
  }

  const permission = await requestPushPermission();
  if (!permission.granted) {
    console.warn("[PushRegistration] Skipped: notification permission not granted.");
    return null;
  }

  const projectId = resolveProjectId();
  return getExpoPushToken(projectId);
}

export function usePushTokenRegistration() {
  const user = useSelector((state: RootState) => state.auth.user);
  const attemptedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    void configurePushNotifications().catch((error) => {
      console.error("[PushRegistration] Failed to configure notifications:", error);
    });
  }, []);

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
