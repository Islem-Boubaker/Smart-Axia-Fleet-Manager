import React from "react";
import { View, Text } from "react-native";

type Coordinate = {
  latitude: number;
  longitude: number;
};

type TripMapProps = {
  coordinates: Coordinate[];
};

export function TripMap(_: TripMapProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#E5E7EB",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
      }}
    >
      <Text
        style={{
          color: "#374151",
          fontSize: 14,
          textAlign: "center",
          fontWeight: "500",
        }}
      >
        Map preview is available on iOS and Android.
      </Text>
    </View>
  );
}
