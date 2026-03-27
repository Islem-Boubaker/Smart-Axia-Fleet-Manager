import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Vehicle } from "../../../types";

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  if (!vehicle) return null;

  return (
    <View style={styles.card}>
      <Text>
        {vehicle.make} {vehicle.model}
      </Text>
      <Text>Year: {vehicle.year}</Text>
      <Text>Plate: {vehicle.licensePlate}</Text>
      <Text>Mileage: {vehicle.mileage} km</Text>
      <Text>Fuel: {vehicle.fuelLevel}%</Text>
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