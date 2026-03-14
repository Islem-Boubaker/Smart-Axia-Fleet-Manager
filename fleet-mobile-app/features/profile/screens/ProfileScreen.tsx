import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../../store/AuthContext";
import { useProfile } from "../hooks/useProfile";

import { ProfileHeader } from "../components/ProfileHeader";
import { DriverInfoCard } from "../components/DriverInfoCard";
import { VehicleCard } from "../components/VehicleCard";
import { ProfileActions } from "../components/ProfileActions";
import { LogoutSection } from "../components/LogoutSection";

import { LoadingSpinner } from "../../../components/common/LoadingSpinner";

export function ProfileScreen() {
  const { state: authState, logout } = useAuth();
  const { vehicle, isLoading } = useProfile();

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView>
      <ScrollView>

        <ProfileHeader user={authState.user} />

        <DriverInfoCard user={authState.user} />

        {vehicle && <VehicleCard vehicle={vehicle} />}

        <ProfileActions />

        <LogoutSection logout={logout} />

      </ScrollView>
    </SafeAreaView>
  );
}