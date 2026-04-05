import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

type Props = {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  [key: string]: unknown;
};

const MapView = React.forwardRef<View, Props>(({ style }, ref) => {
  return (
    <View ref={ref} style={[styles.container, style]}>
      <Text style={styles.text}>Maps are not available on web.</Text>
    </View>
  );
});

MapView.displayName = "MapView";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#5C6B7A",
    fontSize: 14,
  },
});

export default MapView;
