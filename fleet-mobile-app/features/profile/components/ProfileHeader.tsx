import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../theme/colors";

export function ProfileHeader({ user }: any) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="account-circle"
        size={80}
        color={colors.primary}
      />

      <Text style={styles.name}>{user?.name}</Text>

      <Text style={styles.status}>
        {user?.status === "active" ? "✓ Active" : "Inactive"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 24,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
  },
  status: {
    fontSize: 14,
    color: colors.success,
  },
});