import React, { useCallback, useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import ProfileCard from "../components/ProfileCard";
import RankingSection from "../components/RankingSection";
import AccountSection from "../components/AccountSection";
import NotificationsSection from "../components/NotificationsSection";
import PreferenceSection from "../components/PreferenceSection";
import LanguageSection from "../components/LanguageSection";
import LogoutButton from "../components/LogoutButton";
import type { RootState } from "@/store";
import { useProfile } from "../hooks/useProfile";
import { toast } from "@/shared/components/toast/toast";
import { useAppTheme } from "@/shared/theme/ThemeProvider";
import { requestPushPermission } from "@/features/notifications/utils/pushNotifications";

export default function ProfileScreen() {
  const { t } = useTranslation();
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
    [updateNotificationSettings, t],
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
    [updateNotificationSettings, t],
  );

  const setDarkMode = useCallback(
    async (value: boolean) => {
      try {
        await setTheme(value ? "dark" : "light");
      } catch {
        toast.error(t("profile.themeFailed"));
      }
    },
    [setTheme, t],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA] dark:bg-[#0B1220]">
      <View className="mt-10 px-4 pb-4">
        <Text className="text-[22px] font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
          {t("profile.title")}
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
        <LanguageSection />
        <LogoutButton />
      </ScrollView>
    </SafeAreaView>
  );
}
