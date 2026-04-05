import React from "react";
import { View, Text, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import TaskCard from "../components/TaskCard";
import TripCard from "../components/TripCard";
import { router } from "expo-router";
import {
  CURRENT_TASK,
  UPCOMING_TASK,
  RECENT_TRIPS,
} from "../data/dashboard";

function DashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View className="flex-row justify-between px-5 py-3 items-center">
        <View className="flex-row items-center gap-3">
          <MaterialIcons name="menu" size={22} />
          <View>
            <Text className="text-xs text-gray-400">Current Location</Text>
            <Text className="font-bold">Tunis, Tunisia</Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          {/* <MaterialIcons name="search" size={22} /> */}
          <MaterialIcons name="notifications-none" size={22} onPress={() => router.push("/notifications")} />
        </View>
      </View>

      {/* GREETING */}
      <View className="px-5 mb-2">
        <Text className="text-lg font-bold">
          Good morning, Islem 
        </Text>
        <Text className="text-xs text-gray-400">
          Tuesday — 2 trips today
        </Text>
      </View>

      {/* CONTENT */}
      <ScrollView className="px-5">

        <View className="flex-row gap-3 mb-5">
          <TaskCard task={CURRENT_TASK} isCurrent />
          <TaskCard task={UPCOMING_TASK} isCurrent={false} />
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="font-bold">Recent Trips</Text>
          <Text className="text-emerald-600">View all</Text>
        </View>

        {RECENT_TRIPS.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

export { DashboardScreen };
export default DashboardScreen;