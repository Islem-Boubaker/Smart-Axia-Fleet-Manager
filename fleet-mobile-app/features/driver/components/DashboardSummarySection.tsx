import React from "react";
import { View, Text } from "react-native";
import { SummaryCard } from "../../components/cards/SummaryCard";
import { Trip, Vehicle } from "../../types";

type DashboardSummarySectionProps = {
  completedCount: number;
  pendingCount: number;
  activeTrip: Trip | null;
  vehicle: Vehicle | null;
  navigation: any;
};

export function DashboardSummarySection({
  completedCount,
  pendingCount,
  activeTrip,
  vehicle,
  navigation,
}: DashboardSummarySectionProps) {
  return (
    <View className="mb-10">

      <Text className="text-base font-bold text-gray-900 mb-4">
        Quick Summary
      </Text>

      <SummaryCard
        icon="checkbox-marked-circle-outline"
        title="Completed Trips"
        value={completedCount}
        backgroundColor="#D1FAE5"
        iconColor="#22C55E"
        onPress={() =>
          navigation.navigate("Trips", { filterStatus: "completed" })
        }
      />

      <SummaryCard
        icon="clock-outline"
        title="Pending Trips"
        value={pendingCount}
        backgroundColor="#FEF3C7"
        iconColor="#F59E0B"
        onPress={() =>
          navigation.navigate("Trips", { filterStatus: "pending" })
        }
      />

      {activeTrip ? (
        <SummaryCard
          icon="progress-clock"
          title="Active Trip"
          value="In Progress"
          backgroundColor="#DBEAFE"
          iconColor="#3B82F6"
          onPress={() =>
            navigation.navigate("ActiveTrip", {
              tripId: activeTrip.id,
            })
          }
        />
      ) : (
        <SummaryCard
          icon="progress-clock"
          title="Active Trip"
          value="None"
          backgroundColor="#F3F4F6"
          iconColor="#9CA3AF"
        />
      )}

      {vehicle ? (
        <SummaryCard
          icon="truck"
          title="Assigned Vehicle"
          value={`${vehicle.make} ${vehicle.model}`}
          backgroundColor="#E9D5FF"
          iconColor="#A78BFA"
          onPress={() =>
            navigation.navigate("Profile", {
              vehicleId: vehicle.id,
            })
          }
        />
      ) : null}

    </View>
  );
}