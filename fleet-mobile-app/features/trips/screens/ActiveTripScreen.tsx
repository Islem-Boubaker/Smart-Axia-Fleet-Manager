import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { tripsApi } from "../services/trips.api";
import { driverApi } from "@/features/driver/services/driver.api";
import { PrimaryButton } from "@/shared/components/ui/PrimaryButton";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";
import type { Trip } from "../types/trip.types";
import type { Vehicle } from "@/features/driver/types/driver.types";

interface ActiveTripState {
  trip: Trip | null;
  vehicle: Vehicle | null;
  isLoading: boolean;
  isActionLoading: boolean;
  error: string | null;
}

export function ActiveTripScreen({ navigation }: any) {
  const [state, setState] = useState<ActiveTripState>({
    trip: null,
    vehicle: null,
    isLoading: true,
    isActionLoading: false,
    error: null,
  });

  const fetchActiveTrip = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const [trip, vehicle] = await Promise.all([
        tripsApi.getActiveTrip(),
          driverApi.getAssignedVehicle(),
      setState((prev) => ({
        ...prev,
        trip: trip || null,
        vehicle: vehicle || null,
        isLoading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error?.message || "Failed to load active trip",
        isLoading: false,
      }));
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchActiveTrip();
    }, [])
  );

  const handleEndTrip = async () => {
    if (!state.trip) return;

    Alert.alert("End Trip", "Are you sure you want to end this trip?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Trip",
        onPress: async () => {
          setState((prev) => ({ ...prev, isActionLoading: true }));

          try {
            await tripsApi.endTrip(state.trip!.id);

            Alert.alert("Success", "Trip ended successfully", [
              {
                text: "OK",
                onPress: () => navigation.goBack(),
              },
            ]);
          } catch (error: any) {
            Alert.alert("Error", error?.message || "Failed to end trip");
            setState((prev) => ({ ...prev, isActionLoading: false }));
          }
        },
      },
    ]);
  };

  if (state.isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!state.trip) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="flex-1 items-center justify-center">
          <MaterialCommunityIcons
            name="inbox-multiple"
            size={48}
            color="#D1D5DB"
          />
          <Text className="text-gray-500 text-base mt-4">
            No active trip
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const elapsedTime = state.trip.actualStartTime
    ? Math.floor(
        (new Date().getTime() -
          new Date(state.trip.actualStartTime).getTime()) /
          1000 /
          60
      )
    : 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView contentContainerClassName="px-4 py-4">

        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={28}
              color="#3B82F6"
            />
          </TouchableOpacity>

          <Text className="text-xl font-bold text-gray-900 flex-1 text-center">
            Active Trip
          </Text>

          <View className="flex-row items-center bg-blue-100 px-2 py-1 rounded-md">

            <View className="w-2 h-2 bg-blue-500 rounded-full mr-1" />

            <Text className="text-[11px] font-semibold text-blue-500">
              Live
            </Text>

          </View>
        </View>

        {/* Progress */}
        <View className="bg-white rounded-xl p-6 flex-row justify-around mb-6 shadow-sm">

          <View className="items-center flex-1">
            <Text className="text-xs text-gray-500 mb-2">
              Time Elapsed
            </Text>
            <Text className="text-3xl font-bold text-blue-600">
              {elapsedTime} min
            </Text>
          </View>

          {state.trip.distance && (
            <>
              <View className="w-[1px] bg-gray-200" />

              <View className="items-center flex-1">
                <Text className="text-xs text-gray-500 mb-2">
                  Distance
                </Text>
                <Text className="text-3xl font-bold text-blue-600">
                  {state.trip.distance} km
                </Text>
              </View>
            </>
          )}

        </View>

        {/* Route */}
        <View className="mb-6">
          <Text className="text-base font-bold text-gray-900 mb-4">
            Route Details
          </Text>

          <View className="bg-white rounded-xl p-4 shadow-sm">

            <View className="flex-row my-3">
              <View className="w-4 h-4 bg-blue-600 rounded-full mt-1 mr-3" />

              <View className="flex-1">
                <Text className="text-xs font-semibold text-gray-500 mb-1">
                  Pickup
                </Text>
                <Text className="text-sm font-semibold text-gray-900 mb-1">
                  {state.trip.pickupLocation.address}
                </Text>
                <Text className="text-xs text-gray-400">
                  {state.trip.pickupLocation.city}
                </Text>
              </View>
            </View>

            <View className="w-[2px] h-10 bg-gray-200 ml-2" />

            <View className="flex-row my-3">
              <View className="w-4 h-4 bg-green-500 rounded-full mt-1 mr-3" />

              <View className="flex-1">
                <Text className="text-xs font-semibold text-gray-500 mb-1">
                  Destination
                </Text>
                <Text className="text-sm font-semibold text-gray-900 mb-1">
                  {state.trip.destinationLocation.address}
                </Text>
                <Text className="text-xs text-gray-400">
                  {state.trip.destinationLocation.city}
                </Text>
              </View>
            </View>

          </View>
        </View>

        {/* Action */}
        <View className="mt-10 mb-10">

          <PrimaryButton
            label="End Trip"
            onPress={handleEndTrip}
            loading={state.isActionLoading}
            disabled={state.isActionLoading}
            variant="danger"
          />

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}