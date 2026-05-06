import React, { useCallback, useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

import ProfileCard from "../components/ProfileCard";
import RankingSection from "../components/RankingSection";
import AccountSection from "../components/AccountSection";
import NotificationsSection from "../components/NotificationsSection";
import PreferenceSection from "../components/PreferenceSection";
import LogoutButton from "../components/LogoutButton";
import type { RootState } from "@/store";
import { useProfile } from "../hooks/useProfile";
import { toast } from "@/shared/components/toast/toast";
import { useAppTheme } from "@/shared/theme/ThemeProvider";
import { requestPushPermission } from "@/features/notifications/utils/pushNotifications";

export default function ProfileScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { ranking, notificationSettings, updateNotificationSettings, isSaving } = useProfile();
  const { isDark, setTheme } = useAppTheme();

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

  const setDarkMode = useCallback(
    async (value: boolean) => {
      try {
        await setTheme(value ? "dark" : "light");
      } catch {
        toast.error("Failed to update theme mode.");
      }
    },
    [setTheme],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA] dark:bg-[#0B1220]">
      <View className="mt-10 px-4 pb-4">
        <Text className="text-[22px] font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
          Profile
        </Text>
      </View>

      <ScrollView className="pb-8" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 }}>
        <ProfileCard user={user} badgeLabel={ranking?.badge?.label} />
        <RankingSection ranking={ranking} />
        <AccountSection />
        <NotificationsSection
          pushNotif={pushNotif}
          emailUpdates={emailUpdates}
          onTogglePush={setPushNotif}
          onToggleEmail={setEmailUpdates}
          disabled={isSaving}
        />
        <PreferenceSection darkMode={isDark} setDarkMode={setDarkMode} />
        <LogoutButton />
      </ScrollView>
    </SafeAreaView>
  );
}
