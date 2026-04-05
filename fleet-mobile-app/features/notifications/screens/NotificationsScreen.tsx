import * as React from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNotification } from "../hooks/useNotification";
import { NotificationHeader } from "../components/NotificationHeader";
import { NotificationGroupCard } from "../components/NotificationGroupCard";

export default function NotificationsScreen() {
  const { groups, loading, error, unreadCount, markAsRead, markAllAsRead } =
    useNotification();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-gray-100"
    >
      {/* Header */}
      <NotificationHeader
        onMarkAllRead={markAllAsRead}
        unreadCount={unreadCount}
      />

      {/* Loading state */}
      {loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2D9B6F" />
        </View>
      )}

      {/* Error state */}
      {!loading && error && (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-base text-gray-400 text-center">{error}</Text>
        </View>
      )}

      {/* Empty state */}
      {!loading && !error && groups.every((g) => g.items.length === 0) && (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-4xl mb-3">🔔</Text>
          <Text className="text-base font-semibold text-slate-900 mb-1">
            All caught up!
          </Text>
          <Text className="text-sm text-gray-400 text-center">
            No notifications yet. Check back later.
          </Text>
        </View>
      )}

      {/* Notification list */}
      {!loading && !error && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-4 pt-4 pb-8"
        >
          {groups.map((group) => (
            <NotificationGroupCard
              key={group.group}
              group={group}
              onItemPress={markAsRead}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

NotificationsScreen.displayName = "NotificationsScreen";
