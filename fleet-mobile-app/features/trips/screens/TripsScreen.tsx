import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { tripsApi } from "../services/trips.api";
import { TripCard } from "@/features/trips/components/TripCard";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";

interface TripsScreenState {
  trips: any[];
  selectedFilter: "all" | "pending" | "active" | "completed";
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

const filterButtons = [
  { id: "all", label: "All", icon: "list" },
  { id: "pending", label: "Pending", icon: "clock-outline" },
  { id: "active", label: "Active", icon: "progress-clock" },
  { id: "completed", label: "Completed", icon: "check-circle" },
];

export function TripsScreen({ navigation, route }: any) {
  const initialFilter = route?.params?.filterStatus || "all";

  const [state, setState] = useState<TripsScreenState>({
    trips: [],
    selectedFilter: initialFilter,
    isLoading: true,
    isRefreshing: false,
    error: null,
  });

  const fetchTrips = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const trips = await tripsApi.getAllTrips();

      setState((prev) => ({
        ...prev,
        trips: trips || [],
        isLoading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error?.message || "Failed to load trips",
        isLoading: false,
      }));
    }
  };

  const handleRefresh = async () => {
    setState((prev) => ({ ...prev, isRefreshing: true }));
    await fetchTrips();
    setState((prev) => ({ ...prev, isRefreshing: false }));
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchTrips();
    }, [])
  );

  const filteredTrips =
    state.selectedFilter === "all"
      ? state.trips
      : state.trips.filter((trip) => trip.status === state.selectedFilter);

  if (state.isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">

      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-4">

        <Text className="text-2xl font-bold text-gray-900">
          My Trips
        </Text>

        <TouchableOpacity onPress={handleRefresh}>
          <MaterialCommunityIcons
            name="refresh"
            size={24}
            color="#3B82F6"
          />
        </TouchableOpacity>

      </View>

      {/* Filters */}
      <View className="px-4 py-2 border-b border-gray-100 bg-white">

        <FlatList
          data={filterButtons}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const active = state.selectedFilter === item.id;

            return (
              <TouchableOpacity
                className={`flex-row items-center px-4 py-2 rounded-xl ${
                  active ? "bg-blue-600" : "bg-gray-100"
                }`}
                onPress={() =>
                  setState((prev) => ({
                    ...prev,
                    selectedFilter: item.id as any,
                  }))
                }
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={16}
                  color={active ? "#fff" : "#6B7280"}
                  style={{ marginRight: 4 }}
                />

                <Text
                  className={`text-[13px] font-semibold ${
                    active ? "text-white" : "text-gray-500"
                  }`}
                >
                  {item.label}
                </Text>

              </TouchableOpacity>
            );
          }}
        />

      </View>

      {/* Trips List */}
      <FlatList
        data={filteredTrips}
        contentContainerClassName="px-4 py-4"
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={state.isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
          />
        }
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            onPress={() =>
              navigation.navigate("TripDetails", { tripId: item.id })
            }
          />
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-10">

            <MaterialCommunityIcons
              name="inbox-multiple"
              size={48}
              color="#D1D5DB"
            />

            <Text className="text-gray-500 text-base mt-4">
              No {state.selectedFilter !== "all" ? state.selectedFilter : ""} trips
            </Text>

          </View>
        }
      />

    </SafeAreaView>
  );
}

export default TripsScreen;