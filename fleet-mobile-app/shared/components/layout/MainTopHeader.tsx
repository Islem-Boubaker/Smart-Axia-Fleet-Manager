import React, { useCallback, useEffect, useState } from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

import UserAvatar from "@/shared/components/ui/userAvatar";
import { useAppTheme } from "@/shared/theme/ThemeProvider";
import { api } from "@/shared/services/api";

type UnreadResponse =
  | { count?: number }
  | { data?: { count?: number } };

const LOCATION_CACHE_KEY = "axia:last-header-location";
const LOCATION_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const LAST_KNOWN_LOCATION_MAX_AGE_MS = 10 * 60 * 1000;

let cachedLocationLabel: string | null = null;
let cachedLocationUpdatedAt = 0;
let locationRequestInFlight: Promise<string> | null = null;

const isCacheFresh = () =>
  Boolean(cachedLocationLabel) &&
  Date.now() - cachedLocationUpdatedAt < LOCATION_REFRESH_INTERVAL_MS;

const setCachedLocation = (label: string, persist = true) => {
  cachedLocationLabel = label;
  cachedLocationUpdatedAt = Date.now();

  if (persist) {
    void AsyncStorage.setItem(
      LOCATION_CACHE_KEY,
      JSON.stringify({ label, updatedAt: cachedLocationUpdatedAt }),
    ).catch(() => undefined);
  }

  return label;
};

const hydrateCachedLocation = async () => {
  if (cachedLocationLabel) return cachedLocationLabel;

  try {
    const raw = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { label?: unknown; updatedAt?: unknown };
    if (typeof parsed.label !== "string" || typeof parsed.updatedAt !== "number") {
      return null;
    }

    cachedLocationLabel = parsed.label;
    cachedLocationUpdatedAt = parsed.updatedAt;
    return cachedLocationLabel;
  } catch {
    return null;
  }
};

const resolveAddressLabel = async (coords: { latitude: number; longitude: number }) => {
  const address = await Location.reverseGeocodeAsync({
    latitude: coords.latitude,
    longitude: coords.longitude,
  });

  if (!address?.[0]) return "Unknown location";

  return (
    address[0].city ||
    address[0].district ||
    address[0].subregion ||
    address[0].region ||
    address[0].country ||
    "Unknown location"
  );
};

const ensureLocationPermission = async () => {
  const existing = await Location.getForegroundPermissionsAsync();
  if (existing.status === "granted") return true;
  if (existing.status === "denied" && !existing.canAskAgain) return false;

  const requested = await Location.requestForegroundPermissionsAsync();
  return requested.status === "granted";
};

const refreshLocationLabel = async (onInterimLabel?: (label: string) => void) => {
  const hydrated = await hydrateCachedLocation();
  if (hydrated) {
    onInterimLabel?.(hydrated);
  }

  if (isCacheFresh()) {
    return cachedLocationLabel ?? hydrated ?? "Location unavailable";
  }

  if (locationRequestInFlight) {
    return locationRequestInFlight;
  }

  locationRequestInFlight = (async () => {
    try {
      const hasPermission = await ensureLocationPermission();
      if (!hasPermission) {
        return setCachedLocation("Location permission denied", false);
      }

      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: LAST_KNOWN_LOCATION_MAX_AGE_MS,
      });

      if (lastKnown && !cachedLocationLabel) {
        const quickLabel = await resolveAddressLabel(lastKnown.coords);
        onInterimLabel?.(setCachedLocation(quickLabel));
      }

      const coords = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return setCachedLocation(await resolveAddressLabel(coords.coords));
    } catch {
      return cachedLocationLabel || "Location unavailable";
    } finally {
      locationRequestInFlight = null;
    }
  })();

  return locationRequestInFlight;
};

export default function MainTopHeader() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<string>(
    cachedLocationLabel || "Locating...",
  );
  const locationLabel =
    currentLocation === "Locating..."
      ? t("shared.locating")
      : currentLocation === "Unknown location"
        ? t("shared.unknownLocation")
        : currentLocation === "Location unavailable"
          ? t("shared.locationUnavailable")
          : currentLocation === "Location permission denied"
            ? t("shared.locationPermissionDenied")
            : currentLocation;

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get<UnreadResponse>("/notifications/unread-count");
      const payload = res.data as { count?: number; data?: { count?: number } };
      const count = payload.count ?? payload.data?.count ?? 0;
      setUnreadCount(Number.isFinite(count) ? count : 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    void refreshLocationLabel((label) => {
      if (isMounted) setCurrentLocation(label);
    }).then((label) => {
      if (isMounted) setCurrentLocation(label);
    });
    void fetchUnreadCount();

    return () => {
      isMounted = false;
    };
  }, [fetchUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      void fetchUnreadCount();
    }, [fetchUnreadCount]),
  );

  return (
    <View className="flex-row justify-between px-5 py-3 items-center">
      <View>
        <Text className="text-[11px] font-semibold tracking-wide text-gray-400 dark:text-slate-400">
          {t("home.currentLocation")}
        </Text>
        <Text className="font-extrabold text-gray-900 dark:text-gray-50">{locationLabel}</Text>
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
