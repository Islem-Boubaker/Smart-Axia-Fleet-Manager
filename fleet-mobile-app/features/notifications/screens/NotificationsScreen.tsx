import * as React from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useNotification } from "../hooks/useNotification";
import { NotificationHeader } from "../components/NotificationHeader";
import { NotificationGroupCard } from "../components/NotificationGroupCard";
import type { NotificationItem } from "../types/notification.types";

function buildMobileRoute(item: NotificationItem): string | null {
  const { entityType, entityId } = item;
  if (!entityType) return null;

  const id = entityId != null ? String(entityId) : null;

  switch (entityType) {
    case "trip":        return id ? `/trips/${id}` : "/(tabs)/trips";
    case "maintenance": return "/(tabs)/home";
    case "reclamation": return "/(tabs)/home";
    default:            return null;
  }
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { groups, loading, error, unreadCount, markAsRead, markAllAsRead } =
    useNotification();

  const handleItemPress = React.useCallback(
    async (item: NotificationItem) => {
      if (item.unread) {
        await markAsRead(item.id);
      }
      const route = buildMobileRoute(item);
      if (route) {
        router.push(route as any);
      }
    },
    [markAsRead, router],
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-gray-100 dark:bg-[#0B1220]"
    >
      <NotificationHeader
        onMarkAllRead={markAllAsRead}
        unreadCount={unreadCount}
      />

      {loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2D9B6F" />
        </View>
      )}

      {!loading && error && (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-base text-gray-400 dark:text-slate-400 text-center">{t(error)}</Text>
        </View>
      )}

      {!loading && !error && groups.every((g) => g.items.length === 0) && (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-4xl mb-3">🔔</Text>
          <Text className="text-base font-semibold text-slate-900 dark:text-gray-50 mb-1">
            {t("notifications.emptyTitle")}
          </Text>
          <Text className="text-sm text-gray-400 dark:text-slate-400 text-center">
            {t("notifications.emptyMessage")}
          </Text>
        </View>
      )}

      {!loading && !error && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-4 pt-4 pb-8"
        >
          {groups.map((group) => (
            <NotificationGroupCard
              key={group.group}
              group={group}
              onItemPress={handleItemPress}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

NotificationsScreen.displayName = "NotificationsScreen";
