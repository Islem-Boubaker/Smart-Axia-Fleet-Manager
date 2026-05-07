import React, { useCallback, useMemo } from "react";
import { I18nManager, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import NotificationsSection from "../components/NotificationsSection";
import { useProfile } from "../hooks/useProfile";
import { toast } from "@/shared/components/toast/toast";
import { useAppTheme } from "@/shared/theme/ThemeProvider";
import { requestPushPermission } from "@/features/notifications/utils/pushNotifications";

export default function EmailNotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
            toast.error(t("profile.pushUnavailable"));
          }
          if (!permission.unsupportedInExpoGo && !permission.granted) {
            toast.error(t("profile.pushDenied"));
            return;
          }
        }

        await updateNotificationSettings({
          pushTrips: value,
          pushMaintenance: value,
          pushAlerts: value,
        });
        toast.success(value ? t("profile.pushEnabled") : t("profile.pushDisabled"));
      } catch (error) {
        const message = error instanceof Error ? error.message : t("profile.pushFailed");
        toast.error(message);
      }
    },
    [t, updateNotificationSettings],
  );

  const setEmailUpdates = useCallback(
    async (value: boolean) => {
      try {
        await updateNotificationSettings({
          emailTrips: value,
          emailMaintenance: value,
          emailDrivers: value,
        });
        toast.success(value ? t("profile.emailEnabled") : t("profile.emailDisabled"));
      } catch (error) {
        const message = error instanceof Error ? error.message : t("profile.emailFailed");
        toast.error(message);
      }
    },
    [t, updateNotificationSettings],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA] dark:bg-[#0B1220]">
      <View className="flex-row items-center mt-10 px-4 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          {I18nManager.isRTL ? (
            <ChevronRight size={22} color={isDark ? "#F9FAFB" : "#111827"} />
          ) : (
            <ChevronLeft size={22} color={isDark ? "#F9FAFB" : "#111827"} />
          )}
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-gray-900 dark:text-gray-50">
          {t("profile.notifications.email")}
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
