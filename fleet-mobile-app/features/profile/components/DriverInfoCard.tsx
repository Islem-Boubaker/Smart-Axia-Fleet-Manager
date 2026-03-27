import React from "react";
import { View, Text, StyleSheet } from "react-native";

export function DriverInfoCard({ user }: any) {
  return (
    <View style={styles.card}>
      <Text>Email: {user?.email}</Text>
      <Text>Phone: {user?.phone}</Text>
      <Text>License: {user?.licenseNumber}</Text>
      <Text>
        Member Since:{" "}
        {new Date(user?.joinedDate || "").toLocaleDateString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
  },
});