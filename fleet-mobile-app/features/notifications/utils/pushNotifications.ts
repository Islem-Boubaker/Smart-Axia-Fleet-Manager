import Constants from "expo-constants";

type PushPermissionResult = {
  granted: boolean;
  unsupportedInExpoGo: boolean;
};

export async function requestPushPermission(): Promise<PushPermissionResult> {
  if (Constants.executionEnvironment === "storeClient") {
    return { granted: false, unsupportedInExpoGo: true };
  }

  const Notifications = await import("expo-notifications");
  const permission = await Notifications.getPermissionsAsync();
  let status = permission.status;

  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  return { granted: status === "granted", unsupportedInExpoGo: false };
}

export async function getExpoPushToken(projectId?: string): Promise<string | null> {
  if (Constants.executionEnvironment === "storeClient") {
    return null;
  }

  const Notifications = await import("expo-notifications");
  const tokenResult = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  return tokenResult?.data || null;
}
