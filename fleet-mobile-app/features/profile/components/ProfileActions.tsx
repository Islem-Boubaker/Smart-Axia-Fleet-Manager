import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

export function ProfileActions() {
  return (
    <>
      <TouchableOpacity style={styles.btn}>
        <Text>Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn}>
        <Text>Help & Support</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
  },
});