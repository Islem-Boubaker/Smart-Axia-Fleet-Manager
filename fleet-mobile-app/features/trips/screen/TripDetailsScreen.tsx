import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Trip, Vehicle } from "../../types";
import { tripsApi } from "../../services/api/tripsApi";
import { vehicleApi } from "../../services/api/vehicleApi";
import { PrimaryButton } from "../../components/buttons/PrimaryButton";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

interface TripDetailsState {
  trip: Trip | null;
  vehicle: Vehicle | null;
  isLoading: boolean;
  isActionLoading: boolean;
  error: string | null;
}

export function TripDetailsScreen({ route, navigation }: any) {
  const tripId = route?.params?.tripId;

  const [state, setState] = useState<TripDetailsState>({
    trip: null,
    vehicle: null,
    isLoading: true,
    isActionLoading: false,
    error: null,
  });

  React.useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const [trip, vehicle] = await Promise.all([
          tripsApi.getTripDetails(tripId),
          vehicleApi.getAssignedVehicle(),
        ]);

        setState((prev) => ({
          ...prev,
          trip,
          vehicle: vehicle || null,
          isLoading: false,
        }));
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error?.message || "Failed to load trip details",
          isLoading: false,
        }));
      }
    };

    fetchTripDetails();
  }, [tripId]);

  const handleStartTrip = async () => {
    if (!state.trip) return;

    setState((prev) => ({ ...prev, isActionLoading: true }));

    try {
      await tripsApi.startTrip(state.trip.id);

      Alert.alert("Success", "Trip started successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to start trip");
      setState((prev) => ({ ...prev, isActionLoading: false }));
    }
  };

  if (state.isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!state.trip) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="flex-1 items-center justify-center">
          <MaterialCommunityIcons
            name="alert-circle"
            size={48}
            color="#EF4444"
          />
          <Text className="text-gray-500 text-base mt-4">
            Trip not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const trip = state.trip;

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

          <Text className="text-xl font-bold text-gray-900">
            Trip Details
          </Text>

          <View className="w-7" />

        </View>

        {/* Trip Header */}
        <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">

          <View className="flex-row justify-between items-center mb-3">

            <Text className="text-lg font-bold text-gray-900">
              Trip #{trip.id}
            </Text>

            <View className="px-3 py-1 rounded-md bg-yellow-100">
              <Text className="text-xs font-semibold text-yellow-600 capitalize">
                {trip.status}
              </Text>
            </View>

          </View>

          <Text className="text-sm text-gray-500">
            Scheduled{" "}
            {new Date(trip.scheduledTime).toLocaleString()}
          </Text>

        </View>

        {/* Route */}
        <View className="mb-6">

          <Text className="text-base font-bold text-gray-900 mb-4">
            Route
          </Text>

          <View className="bg-white rounded-xl p-4 shadow-sm">

            <View className="flex-row my-3">
              <MaterialCommunityIcons
                name="map-marker"
                size={24}
                color="#3B82F6"
              />

              <View className="ml-4 flex-1">
                <Text className="text-xs font-semibold text-gray-500">
                  Pickup
                </Text>

                <Text className="text-sm font-semibold text-gray-900">
                  {trip.pickupLocation.address}
                </Text>

                <Text className="text-xs text-gray-400">
                  {trip.pickupLocation.city}
                </Text>
              </View>
            </View>

            <View className="h-10 w-[2px] bg-gray-200 ml-3" />

            <View className="flex-row my-3">
              <MaterialCommunityIcons
                name="map-marker-check"
                size={24}
                color="#22C55E"
              />

              <View className="ml-4 flex-1">
                <Text className="text-xs font-semibold text-gray-500">
                  Destination
                </Text>

                <Text className="text-sm font-semibold text-gray-900">
                  {trip.destinationLocation.address}
                </Text>

                <Text className="text-xs text-gray-400">
                  {trip.destinationLocation.city}
                </Text>
              </View>
            </View>

          </View>
        </View>

        {/* Stats */}
        <View className="mb-6">

          <Text className="text-base font-bold text-gray-900 mb-4">
            Trip Details
          </Text>

          <View className="flex-row gap-4">

            {trip.distance && (
              <View className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm">
                <MaterialCommunityIcons
                  name="road"
                  size={24}
                  color="#3B82F6"
                />
                <Text className="text-xs text-gray-500 mt-2">
                  Distance
                </Text>
                <Text className="text-base font-bold text-gray-900">
                  {trip.distance} km
                </Text>
              </View>
            )}

            {trip.fare && (
              <View className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm">
                <MaterialCommunityIcons
                  name="currency-usd"
                  size={24}
                  color="#22C55E"
                />
                <Text className="text-xs text-gray-500 mt-2">
                  Fare
                </Text>
                <Text className="text-base font-bold text-gray-900">
                  ${trip.fare}
                </Text>
              </View>
            )}

          </View>

        </View>

        {/* Vehicle */}
        {state.vehicle && (
          <View className="mb-6">

            <Text className="text-base font-bold text-gray-900 mb-4">
              Vehicle
            </Text>

            <View className="bg-white rounded-xl p-4 shadow-sm">

              <Text className="text-base font-bold text-gray-900">
                {state.vehicle.make} {state.vehicle.model}
              </Text>

              <Text className="text-lg font-bold text-blue-600 mt-2 tracking-widest">
                {state.vehicle.licensePlate}
              </Text>

              <Text className="text-sm text-gray-500 mt-1">
                {state.vehicle.year}
              </Text>

            </View>

          </View>
        )}

        {/* Action */}
        {trip.status === "pending" && (
          <View className="my-6">

            <PrimaryButton
              label="Start Trip"
              onPress={handleStartTrip}
              loading={state.isActionLoading}
              disabled={state.isActionLoading}
            />

          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}