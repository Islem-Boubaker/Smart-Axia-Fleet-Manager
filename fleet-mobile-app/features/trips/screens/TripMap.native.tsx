import React from "react";
import MapView, { Marker, Polyline } from "react-native-maps";

type Coordinate = {
  latitude: number;
  longitude: number;
};

type TripMapProps = {
  coordinates: Coordinate[];
};

export function TripMap({ coordinates }: TripMapProps) {
  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: 36.8325,
        longitude: 10.2065,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      <Marker coordinate={coordinates[0]} pinColor="green" />
      <Marker coordinate={coordinates[coordinates.length - 1]} pinColor="red" />
      <Polyline coordinates={coordinates} strokeColor="#6B21F5" strokeWidth={5} />
    </MapView>
  );
}
