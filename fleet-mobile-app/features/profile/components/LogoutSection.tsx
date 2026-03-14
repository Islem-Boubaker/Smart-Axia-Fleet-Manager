import React from "react";
import { Alert } from "react-native";
import { PrimaryButton } from "../../../components/buttons/PrimaryButton";

export function LogoutSection({ logout }: any) {
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: logout },
    ]);
  };

  return <PrimaryButton label="Logout" onPress={handleLogout} variant="danger" />;
}