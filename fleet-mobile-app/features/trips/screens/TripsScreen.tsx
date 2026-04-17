import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";
import { TripCard } from "../components/TripCard";
import { TripEmptyState } from "../components/TripEmptyState";
import { TripFilterChips } from "../components/TripFilterChips";
import { TripStatsRow } from "../components/TripStatsRow";
import type { FilterOption } from "../config/trips.config";

import { tripsApi } from "../services/trips.api";
import type { Trip } from "../types/trip.types";
import BackButton from "@/shared/components/ui/BackButton";
import RefreshButton from "@/shared/components/ui/RefreshButton";

// ─── Types ────────────────────────────────────────────────────────
type TripLike = Partial<Trip> & {
  fromCoords?: { lat?: number; lng?: number };
  toCoords?: { lat?: number; lng?: number };
};

// ─── Normalize — every field guaranteed non-undefined ─────────────
const normalizeTrip = (raw: TripLike, index: number): Trip => ({
  id: String(raw?.id ?? index + 1),
  tripNumber: raw?.tripNumber ?? "",
  vehicle: raw?.vehicle ?? "",
  from: raw?.from ?? "",
  to: raw?.to ?? "",
  distance: raw?.distance ?? "",
  duration: raw?.duration ?? "",
  date: raw?.date ?? "",
  score: raw?.score ?? null,
  lat: raw?.lat ?? raw?.fromCoords?.lat ?? 0,
  lng: raw?.lng ?? raw?.fromCoords?.lng ?? 0,
  status:
    raw?.status === "completed" ||
    raw?.status === "active" ||
    raw?.status === "pending"
      ? raw.status
      : "pending",
  pickupLocation: (typeof raw?.pickupLocation === 'string' ? { address: raw.pickupLocation } : raw?.pickupLocation) ?? { address: raw?.from ?? "" },
  destinationLocation: (typeof raw?.destinationLocation === 'string' ? { address: raw.destinationLocation } : raw?.destinationLocation) ?? { address: raw?.to ?? "" },
});

// ✅ Guard against data itself being undefined/null
const normalizeTrips = (items: unknown): Trip[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item, i) => normalizeTrip(item as TripLike, i));
};

// const fallbackTrips: Trip[] = normalizeTrips(data);

// ─── TripsScreen ──────────────────────────────────────────────────
export function TripsScreen() {
  const router = useRouter();
 
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState<FilterOption>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchTrips = async () => {
    try {
      setError(null);
      const apiData = await tripsApi.getAllTrips();
      const normalized = normalizeTrips(apiData);
      setTrips(normalized.length > 0 ? normalized : []);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load trips");
      setTrips([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTrips();
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchTrips();
    }, []),
  );

  // ── Derived ────────────────────────────────────────────────────
  const filtered =
    filter === "all" ? trips : trips.filter((t) => t?.status === filter);

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />

      {/* Header */}
      <View className="flex-row justify-between items-center px-5 pb-2"  style={{ paddingTop: Platform.OS === "ios" ? 8 : 0 }}>
        <BackButton/>
        <View>
          <Text className="text-2xl font-extrabold text-slate-900">
            My Trips
          </Text>
          <Text className="text-xs text-gray-400 mt-0.5">
            {trips.length} trip{trips.length !== 1 ? "s" : ""} assigned
          </Text>
        </View>
        <RefreshButton onRefresh={handleRefresh} />
      </View>

      {/* Filter chips */}
      <TripFilterChips selected={filter} onChange={setFilter} />

      {/* Stats */}
      <TripStatsRow trips={trips} />

      {/* Section header */}
      <View className="flex-row justify-between items-center px-5 mb-2">
        <Text className="text-[13px] font-bold text-gray-700">
          {filter === "all"
            ? "All trips"
            : `${filter.charAt(0).toUpperCase() + filter.slice(1)} trips`}
        </Text>
        <Text className="text-[11px] text-gray-400">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Error banner */}
      {error && (
        <View className="mx-5 mb-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex-row items-center gap-2">
          <MaterialIcons name="error-outline" size={16} color="#EF4444" />
          <Text className="text-xs text-red-600 flex-1">{error}</Text>
          <TouchableOpacity onPress={fetchTrips}>
            <Text className="text-xs font-bold text-red-500">Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Trip list */}
      <FlatList
        data={filtered}
        // ✅ Always return a string — never undefined
        keyExtractor={(item, index) => String(item?.id ?? index)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#2D9B6F"
            colors={["#2D9B6F"]}
          />
        }
        renderItem={({ item }) => {
          // ✅ Skip rendering if item is somehow undefined
          if (!item) return null;

          return (
            <TripCard
              trip={item}
              onPress={() => {
                // ✅ Safe navigation — only push if id exists
                if (!item.id) return;
                router.replace(`/trips/${item.id}`);
              }}
            />
          );
        }}
        ListEmptyComponent={<TripEmptyState filter={filter} />}
      />
    </SafeAreaView>
  );
}

export default TripsScreen;
