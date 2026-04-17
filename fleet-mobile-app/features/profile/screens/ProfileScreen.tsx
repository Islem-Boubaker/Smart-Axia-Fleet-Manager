import React, { useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";

import ProfileCard from "../components/ProfileCard";
import AccountSection from "../components/AccountSection";
import NotificationsSection from "../components/NotificationsSection";
import PreferenceSection from "../components/PreferenceSection";
import PrivacySecuritySection from "../components/PrivacySecuritySection";
import SupportSection from "../components/SupportSection";
import AboutSection from "../components/AboutSection";
import LogoutButton from "../components/LogoutButton";
import BackButton from "@/shared/components/ui/BackButton";
import { useProfile } from "../hooks/useProfile";

export default function ProfileScreen() {
  const { user, notificationSettings, updateNotificationSettings, isLoading } = useProfile();

  const [darkMode, setDarkMode] = useState(false);
  const [twoFA, setTwoFA] = useState(false);

  const handlePushToggle = (valueOrUpdater: boolean | ((value: boolean) => boolean)) => {
    const nextValue =
      typeof valueOrUpdater === "function"
        ? valueOrUpdater(notificationSettings.pushAlerts)
        : valueOrUpdater;
    void updateNotificationSettings({ pushAlerts: nextValue });
  };

  const handleEmailToggle = (valueOrUpdater: boolean | ((value: boolean) => boolean)) => {
    const nextValue =
      typeof valueOrUpdater === "function"
        ? valueOrUpdater(notificationSettings.emailTrips)
        : valueOrUpdater;
    void updateNotificationSettings({ emailTrips: nextValue });
  };

  if (isLoading && !user) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA]">
      <View className="flex-row items-center " style={{ paddingTop: Platform.OS === "ios" ? 8 : 0 }}>
        <BackButton/>
        <Text className="flex-1 text-center text-lg font-bold text-gray-900">
          Profile
        </Text>
      </View>

      <ScrollView className="pb-8" showsVerticalScrollIndicator={false}>
        <ProfileCard user={user} />
        <AccountSection />
        <NotificationsSection
          pushNotif={notificationSettings.pushAlerts}
          setPushNotif={handlePushToggle}
          emailUpdates={notificationSettings.emailTrips}
          setEmailUpdates={handleEmailToggle}
        />
        <PreferenceSection darkMode={darkMode} setDarkMode={setDarkMode} />
        <PrivacySecuritySection twoFA={twoFA} setTwoFA={setTwoFA} />
        <SupportSection />
        <AboutSection />
        <LogoutButton />
      </ScrollView>
    </SafeAreaView>
  );
}
