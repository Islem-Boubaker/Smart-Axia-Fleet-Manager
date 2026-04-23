import React from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import NotificationsSection from "../components/NotificationsSection";
import { useProfile } from "../hooks/useProfile";

export default function EmailNotificationsScreen() {
  const router = useRouter();
  const { notificationSettings, updateNotificationSettings, isSaving } = useProfile();

  const setPushNotif = (valueOrUpdater: boolean | ((value: boolean) => boolean)) => {
    const nextValue =
      typeof valueOrUpdater === "function"
        ? valueOrUpdater(notificationSettings.pushAlerts)
        : valueOrUpdater;
    void updateNotificationSettings({ pushAlerts: nextValue }).catch((error) => {
      Alert.alert(
        "Update failed",
        error instanceof Error ? error.message : "Could not update notifications.",
      );
    });
  };

  const setEmailUpdates = (valueOrUpdater: boolean | ((value: boolean) => boolean)) => {
    const nextValue =
      typeof valueOrUpdater === "function"
        ? valueOrUpdater(notificationSettings.emailTrips)
        : valueOrUpdater;
    void updateNotificationSettings({ emailTrips: nextValue }).catch((error) => {
      Alert.alert(
        "Update failed",
        error instanceof Error ? error.message : "Could not update notifications.",
      );
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA]">
      <View className="flex-row items-center mt-10 px-4 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-lg text-gray-900">‹</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-gray-900">
          Email Notifications
        </Text>
      </View>

      <NotificationsSection
        pushNotif={notificationSettings.pushAlerts}
        setPushNotif={setPushNotif}
        emailUpdates={notificationSettings.emailTrips}
        setEmailUpdates={setEmailUpdates}
      />

      {isSaving ? (
        <Text className="text-center text-xs text-gray-400 mt-3">Saving changes...</Text>
      ) : null}
    </SafeAreaView>
  );
}
