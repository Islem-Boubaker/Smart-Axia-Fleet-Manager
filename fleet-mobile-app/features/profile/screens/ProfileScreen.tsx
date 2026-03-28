import React, { useState } from "react";
import { SafeAreaView, StatusBar, ScrollView, View, Text, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useProfile } from "../hooks/useProfile";
import { clearUser } from "@/store/slices/authSlice";
import { logout as logoutApi } from "../services/profile.api";
import type { RootState } from "@/store";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";

import ProfileHeader from "../components/ProfileHeader";
import DriverInfoCard from "../components/DriverInfoCard";
import VehicleCard from "../components/VehicleCard";
import ProfileActions from "../components/ProfileActions";
import LogoutSection from "../components/LogoutSection";

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();

  const user = useSelector((state: RootState) => state.auth.user);
  const { vehicle, isLoading } = useProfile();

  const [notifEnabled, setNotifEnabled] = useState(true);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logoutApi();
          } catch {
            dispatch(clearUser());
          } finally {
            router.replace("/(auth)/login");
          }
        },
      },
    ]);
  };

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-[#F0F5F0]">
      <StatusBar barStyle="dark-content" backgroundColor="#F0F5F0" />

      <View className="flex-row items-center justify-between px-5 py-12">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={20} />
        </TouchableOpacity>

        <Text className="text-[17px] font-bold">Profile</Text>

        <TouchableOpacity onPress={() => router.push("/profile/settings")}>
          <MaterialIcons name="settings" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView>
        <ProfileHeader />
        <DriverInfoCard user={user} />
        <VehicleCard vehicle={vehicle} />
        <ProfileActions
          user={user}
          notifEnabled={notifEnabled}
          setNotifEnabled={setNotifEnabled}
        />
        <LogoutSection onLogout={handleLogout} />
      </ScrollView>
    </SafeAreaView>
  );
}