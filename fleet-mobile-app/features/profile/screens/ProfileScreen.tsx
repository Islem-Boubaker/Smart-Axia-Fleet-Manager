import React, { useState } from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { ChevronLeft } from "lucide-react-native";

import ProfileCard from "../components/ProfileCard";
import AccountSection from "../components/AccountSection";
import NotificationsSection from "../components/NotificationsSection";
import PreferenceSection from "../components/PreferenceSection";
import PrivacySecuritySection from "../components/PrivacySecuritySection";
import SupportSection from "../components/SupportSection";
import AboutSection from "../components/AboutSection";
import LogoutButton from "../components/LogoutButton";
import type { RootState } from "@/store";

export default function ProfileScreen() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);

  const [pushNotif, setPushNotif] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [twoFA, setTwoFA] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA]">
      <View className="flex-row items-center mt-10 px-4 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-gray-900">
          Profile
        </Text>
      </View>

      <ScrollView className="pb-8" showsVerticalScrollIndicator={false}>
        <ProfileCard user={user} />
        <AccountSection />
        <NotificationsSection
          pushNotif={pushNotif}
          setPushNotif={setPushNotif}
          emailUpdates={emailUpdates}
          setEmailUpdates={setEmailUpdates}
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
