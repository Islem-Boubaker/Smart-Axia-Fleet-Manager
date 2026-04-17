import React from "react";
import { View, Text, ScrollView, StatusBar, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import UserAvatar from "@/shared/components/ui/userAvatar";
import TaskCard from "../components/TaskCard";
import TripCard from "../components/TripCard";
import { router } from "expo-router";
import { useDashboard } from "../hooks/useDashboard";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

function DashboardScreen() {
  const {
    user,
    activeTrip,
    upcomingTrip,
    recentTrips,
    completedCount,
    pendingCount,
    unreadCount,
    isLoading,
    error,
    refetch,
  } = useDashboard();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  const currentTask = activeTrip ?? upcomingTrip;
  const secondaryUpcoming = activeTrip ? upcomingTrip : null;
  const region = activeTrip?.region ?? upcomingTrip?.region ?? "No active region";

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 px-5 items-center justify-center">
        <Text className="text-red-500 font-semibold mb-2">Failed to load dashboard</Text>
        <Text className="text-gray-500 text-center mb-4">{error}</Text>
        <TouchableOpacity
          onPress={() => void refetch()}
          className="bg-blue-600 px-5 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View className="flex-row justify-between px-5 py-3 items-center">
        <View className="flex-row items-center gap-3">
          <MaterialIcons name="menu" size={22} />
          <View>
            <Text className="text-xs text-gray-400">Current Location</Text>
            <Text className="font-bold">{region}</Text>
          </View>
        </View>

        <View className="flex-row gap-3 justify-center items-center">
          <TouchableOpacity onPress={() => router.push("/notifications")} className="relative">
            <MaterialIcons name="notifications-none" size={22} />
            {unreadCount > 0 ? (
              <View className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 items-center justify-center">
                <Text className="text-[10px] text-white font-bold">{unreadCount > 99 ? "99+" : unreadCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
          <UserAvatar size={{ width: 10, height: 10 }} />
        </View>
      </View>

      {/* GREETING */}
      <View className="px-5 mb-2">
        <Text className="text-lg font-bold">
          {`${getGreeting()}, ${user?.name ?? "Driver"}`}
        </Text>
        <Text className="text-xs text-gray-400">
          {`Pending ${pendingCount} - Completed ${completedCount}`}
        </Text>
      </View>

      {/* CONTENT */}
      <ScrollView className="px-5">

        <View className="flex-row gap-3 mb-5">
          <TaskCard trip={currentTask} isCurrent />
          <TaskCard trip={secondaryUpcoming} isCurrent={false} />
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="font-bold">Recent Trips</Text>
          <Text className="text-emerald-600">View all</Text>
        </View>

        {recentTrips.length === 0 ? (
          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200">
            <Text className="text-gray-600 font-medium">No trips found</Text>
            <Text className="text-gray-400 text-xs mt-1">You have no completed trips yet.</Text>
          </View>
        ) : (
          recentTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)
        )}

        {activeTrip && (
          <View className="mt-4 mb-8 rounded-xl bg-emerald-50 px-4 py-3">
            <Text className="text-xs text-emerald-700">Active trip</Text>
            <Text className="text-sm font-semibold text-emerald-900">{activeTrip.startLocation} {"->"} {activeTrip.endLocation}</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

export { DashboardScreen };
export default DashboardScreen;