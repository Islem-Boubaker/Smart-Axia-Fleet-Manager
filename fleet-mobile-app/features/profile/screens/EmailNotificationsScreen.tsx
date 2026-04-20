import React, { useCallback, useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

import NotificationsSection from "../components/NotificationsSection";
import { useProfile } from "../hooks/useProfile";
import { toast } from "@/shared/components/toast/toast";
import { useAppTheme } from "@/shared/theme/ThemeProvider";
import { requestPushPermission } from "@/features/notifications/utils/pushNotifications";

export default function EmailNotificationsScreen() {
  const router = useRouter();
  const { notificationSettings, updateNotificationSettings, isSaving } = useProfile();
  const { isDark } = useAppTheme();

  const pushNotif = useMemo(
    () =>
      notificationSettings.pushTrips &&
      notificationSettings.pushMaintenance &&
      notificationSettings.pushAlerts,
    [notificationSettings.pushAlerts, notificationSettings.pushMaintenance, notificationSettings.pushTrips],
  );

  const emailUpdates = useMemo(
    () =>
      notificationSettings.emailTrips &&
      notificationSettings.emailMaintenance &&
      notificationSettings.emailDrivers,
    [notificationSettings.emailDrivers, notificationSettings.emailMaintenance, notificationSettings.emailTrips],
  );

  const setPushNotif = useCallback(
    async (value: boolean) => {
      try {
        if (value) {
          const permission = await requestPushPermission();
          if (permission.unsupportedInExpoGo) {
            toast.error("Push delivery is unavailable in Expo Go. Preference will still be saved.");
          }
          if (!permission.unsupportedInExpoGo && !permission.granted) {
            toast.error("Push permission denied. Enable it in phone settings.");
            return;
          }
        }

        await updateNotificationSettings({
          pushTrips: value,
          pushMaintenance: value,
          pushAlerts: value,
        });
        toast.success(`Push notifications ${value ? "enabled" : "disabled"}.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update push notifications";
        toast.error(message);
      }
    },
    [updateNotificationSettings],
  );

  const setEmailUpdates = useCallback(
    async (value: boolean) => {
      try {
        await updateNotificationSettings({
          emailTrips: value,
          emailMaintenance: value,
          emailDrivers: value,
        });
        toast.success(`Email notifications ${value ? "enabled" : "disabled"}.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update email notifications";
        toast.error(message);
      }
    },
    [updateNotificationSettings],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA] dark:bg-[#0B1220]">
      <View className="flex-row items-center mt-10 px-4 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={22} color={isDark ? "#F9FAFB" : "#111827"} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-gray-900 dark:text-gray-50">
          Email Notifications
        </Text>
      </View>

      <NotificationsSection
        pushNotif={pushNotif}
        emailUpdates={emailUpdates}
        onTogglePush={setPushNotif}
        onToggleEmail={setEmailUpdates}
        disabled={isSaving}
      />
    </SafeAreaView>
  );
}
