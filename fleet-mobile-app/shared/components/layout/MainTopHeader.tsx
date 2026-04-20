import React, { useCallback, useEffect, useState } from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as Location from "expo-location";

import UserAvatar from "@/shared/components/ui/userAvatar";
import { useAppTheme } from "@/shared/theme/ThemeProvider";
import { api } from "@/shared/services/api";

type UnreadResponse =
  | { count?: number }
  | { data?: { count?: number } };

export default function MainTopHeader() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<string>("Getting location...");

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get<UnreadResponse>("/notifications/unread-count");
      const count = res.data?.count ?? res.data?.data?.count ?? 0;
      setUnreadCount(Number.isFinite(count) ? count : 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const fetchCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setCurrentLocation("Location permission denied");
        return;
      }

      const coords = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const address = await Location.reverseGeocodeAsync({
        latitude: coords.coords.latitude,
        longitude: coords.coords.longitude,
      });

      if (address?.[0]) {
        const locationText =
          address[0].city || address[0].region || address[0].country || "Unknown location";
        setCurrentLocation(locationText);
      } else {
        setCurrentLocation("Unable to get address");
      }
    } catch {
      setCurrentLocation("Location unavailable");
    }
  }, []);

  useEffect(() => {
    void fetchCurrentLocation();
    void fetchUnreadCount();
  }, [fetchCurrentLocation, fetchUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      void fetchUnreadCount();
    }, [fetchUnreadCount]),
  );

  return (
    <View className="flex-row justify-between px-5 py-3 items-center">
      <View>
        <Text className="text-[11px] font-semibold tracking-wide text-gray-400 dark:text-slate-400">
          Current Location
        </Text>
        <Text className="font-extrabold text-gray-900 dark:text-gray-50">{currentLocation}</Text>
      </View>

      <View className="flex-row gap-3 justify-center items-center">
        <TouchableOpacity onPress={() => router.push("/notifications")} className="relative">
          <MaterialIcons
            name="notifications-none"
            size={22}
            color={isDark ? "#FFFFFF" : "#111827"}
          />
          {unreadCount > 0 ? (
            <View className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 items-center justify-center">
              <Text className="text-[10px] text-white font-bold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/profile")} activeOpacity={0.8}>
          <UserAvatar size={{ width: 10, height: 10 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

