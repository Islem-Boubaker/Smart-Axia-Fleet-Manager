import React, { useState } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

import NotificationsSection from "../components/NotificationsSection";

export default function EmailNotificationsScreen() {
  const router = useRouter();
  const [pushNotif, setPushNotif] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA]">
      <View className="flex-row items-center mt-10 px-4 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-gray-900">
          Email Notifications
        </Text>
      </View>

      <NotificationsSection
        pushNotif={pushNotif}
        setPushNotif={setPushNotif}
        emailUpdates={emailUpdates}
        setEmailUpdates={setEmailUpdates}
      />
    </SafeAreaView>
  );
}
