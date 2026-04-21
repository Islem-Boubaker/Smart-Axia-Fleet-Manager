import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, StatusBar, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";

import BackButton from "@/shared/components/ui/BackButton";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";
import { useAppTheme } from "@/shared/theme/ThemeProvider";
import { useTripActions } from "@/features/trips/hooks/useTripActions";
import { useTripDetail } from "@/features/trips/hooks/useTripDetail";
import { useRoutePolyline } from "@/features/trips/hooks/useRoutePolyline";
import { tripsApi } from "@/features/trips/services/trips.api";
import { resolveTunisiaAddressToCoord } from "@/features/trips/utils/geocoding";
import { filterDestinationDuplicateStops } from "@/features/trips/utils/routeDedup";

type LatLng = { latitude: number; longitude: number };
type StopStatus = "pending" | "reached" | "skipped" | "unknown";

const DEFAULT_REGION = {
  latitude: 36.8065,
  longitude: 10.1815,
  latitudeDelta: 0.25,
  longitudeDelta: 0.25,
};
const ARRIVAL_RADIUS_METERS = 60;

function toAddress(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "address" in value) {
    return String((value as { address?: unknown }).address ?? "").trim();
  }
  return "";
}

function normalizeStopStatus(value: unknown): "pending" | "reached" | "skipped" | "unknown" {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "pending") return "pending";
  if (normalized === "reached") return "reached";
  if (normalized === "skipped") return "skipped";
  return "unknown";
}

function getDistanceMeters(a: LatLng, b: LatLng): number {
  const earthRadius = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const h =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  return 2 * earthRadius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function areCoordsClose(a: LatLng | null, b: LatLng | null, epsilon = 0.0002): boolean {
  if (!a || !b) return false;
  return Math.abs(a.latitude - b.latitude) <= epsilon && Math.abs(a.longitude - b.longitude) <= epsilon;
}

function getRegion(coords: LatLng[]) {
  if (coords.length === 0) {
    return DEFAULT_REGION;
  }
  const lats = coords.map((c) => c.latitude);
  const lngs = coords.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.03, (maxLat - minLat) * 1.4),
    longitudeDelta: Math.max(0.03, (maxLng - minLng) * 1.4),
  };
}

export default function LiveTripScreen() {
  const { isDark } = useAppTheme();
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);
  const watchSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const lastPingAtRef = useRef(0);
  const pingDisabledRef = useRef(false);
  const hasInitialFitRef = useRef(false);
  const autoReachedStopIdsRef = useRef<Record<string, boolean>>({});
  const geocodeCacheRef = useRef<Record<string, LatLng>>({});
  const lastFittedRouteKeyRef = useRef("");

  const params = useLocalSearchParams<{ tripId?: string | string[] }>();
  const tripId = Array.isArray(params.tripId) ? params.tripId[0] : params.tripId;

  const { trip, isLoading, error, reload } = useTripDetail(tripId);
  const { markStopReached, isSubmitting: isSubmittingTripAction } = useTripActions();
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [destinationCoord, setDestinationCoord] = useState<LatLng | null>(null);
  const [resolvedStopCoords, setResolvedStopCoords] = useState<Record<string, LatLng>>({});
  const [localStopStatuses, setLocalStopStatuses] = useState<Record<string, StopStatus>>({});
  const [isResolvingDestination, setIsResolvingDestination] = useState(false);
  const [isResolvingStops, setIsResolvingStops] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);

  const destinationAddress = useMemo(
    () => toAddress(trip?.destinationLocation) || trip?.to || "",
    [trip?.destinationLocation, trip?.to],
  );
  const destinationCoordsFromTrip = useMemo(() => {
    if (trip?.destinationLocation?.latitude != null && trip?.destinationLocation?.longitude != null) {
      return {
        latitude: trip.destinationLocation.latitude,
        longitude: trip.destinationLocation.longitude,
      };
    }
    if (trip?.endLatitude != null && trip?.endLongitude != null) {
      return {
        latitude: trip.endLatitude,
        longitude: trip.endLongitude,
      };
    }
    return null;
  }, [
    trip?.destinationLocation?.latitude,
    trip?.destinationLocation?.longitude,
    trip?.endLatitude,
    trip?.endLongitude,
  ]);

  const sortedStops = useMemo(() => {
    return [...(trip?.stops ?? [])].sort((a, b) => a.stopOrder - b.stopOrder);
  }, [trip?.stops]);
  const visibleSortedStops = useMemo(() => {
    return filterDestinationDuplicateStops(sortedStops, destinationAddress, destinationCoordsFromTrip);
  }, [destinationAddress, destinationCoordsFromTrip, sortedStops]);

  useEffect(() => {
    setLocalStopStatuses({});
    autoReachedStopIdsRef.current = {};
  }, [tripId]);

  const resolveAddressToCoord = React.useCallback(async (address: string): Promise<LatLng | null> => {
    return resolveTunisiaAddressToCoord(address, geocodeCacheRef.current);
  }, []);

  const resolvedStops = useMemo(() => {
    return visibleSortedStops.map((stop) => {
      const coordinate =
        stop.latitude != null && stop.longitude != null
          ? { latitude: stop.latitude as number, longitude: stop.longitude as number }
          : resolvedStopCoords[String(stop.id)] ?? null;

      const effectiveStatus = localStopStatuses[String(stop.id)] ?? normalizeStopStatus(stop.status);

      return {
        ...stop,
        coordinate,
        effectiveStatus,
      };
    });
  }, [localStopStatuses, resolvedStopCoords, visibleSortedStops]);

  const nextStop = useMemo(() => {
    const pending = resolvedStops.find((stop) => stop.effectiveStatus === "pending");
    if (pending) return pending;

    return (
      resolvedStops.find((stop) => {
        const status = stop.effectiveStatus;
        return status !== "reached" && status !== "skipped";
      }) ?? null
    );
  }, [resolvedStops]);

  const stopCoords = useMemo(() => {
    return resolvedStops
      .map((stop) => stop.coordinate)
      .filter((stop): stop is LatLng => Boolean(stop));
  }, [resolvedStops]);

  const remainingStopCoords = useMemo(() => {
    return resolvedStops
      .filter((stop) => stop.effectiveStatus !== "reached" && stop.effectiveStatus !== "skipped")
      .map((stop) => stop.coordinate)
      .filter((stop): stop is LatLng => Boolean(stop));
  }, [resolvedStops]);

  useEffect(() => {
    let cancelled = false;

    async function resolveStops() {
      const unresolved = sortedStops.filter(
        (stop) =>
          (stop.latitude == null || stop.longitude == null) &&
          stop.locationName?.trim() &&
          !resolvedStopCoords[String(stop.id)],
      );

      if (unresolved.length === 0) return;

      setIsResolvingStops(true);

      try {
        const pairs = await Promise.all(
          unresolved.map(async (stop) => {
            const coordinate = await resolveAddressToCoord(String(stop.locationName ?? ""));
            return [String(stop.id), coordinate] as const;
          }),
        );

        if (cancelled) return;

        setResolvedStopCoords((current) => {
          const next = { ...current };
          for (const [stopId, coordinate] of pairs) {
            if (coordinate) {
              next[stopId] = coordinate;
            }
          }
          return next;
        });
      } finally {
        if (!cancelled) {
          setIsResolvingStops(false);
        }
      }
    }

    void resolveStops();
    return () => {
      cancelled = true;
    };
  }, [resolveAddressToCoord, resolvedStopCoords, sortedStops]);

  useEffect(() => {
    let cancelled = false;

    async function resolveDestination() {
      if (!trip) {
        setDestinationCoord(null);
        return;
      }

      if (destinationCoordsFromTrip) {
        setDestinationCoord(destinationCoordsFromTrip);
        setIsResolvingDestination(false);
        return;
      }

      setIsResolvingDestination(true);
      const fallbackFromStops = stopCoords.length > 0 ? stopCoords[stopCoords.length - 1] : null;

      try {
        if (!destinationAddress) {
          setDestinationCoord(fallbackFromStops);
          return;
        }

        const resolvedCoord = await resolveAddressToCoord(destinationAddress);
        if (!cancelled) {
          setDestinationCoord(resolvedCoord ?? fallbackFromStops);
        }
      } catch {
        if (!cancelled) {
          setDestinationCoord(fallbackFromStops);
        }
      } finally {
        if (!cancelled) setIsResolvingDestination(false);
      }
    }

    void resolveDestination();
    return () => {
      cancelled = true;
    };
  }, [destinationAddress, destinationCoordsFromTrip, resolveAddressToCoord, stopCoords, trip]);

  const handleMarkNextStopReached = React.useCallback(async () => {
    if (!tripId || !nextStop?.id) return;

    const nextStopId = String(nextStop.id);
    autoReachedStopIdsRef.current[nextStopId] = true;
    setLocalStopStatuses((current) => ({ ...current, [nextStopId]: "reached" }));

    try {
      await markStopReached(tripId, nextStopId, new Date().toISOString());
      await reload();
    } catch (err) {
      autoReachedStopIdsRef.current[nextStopId] = false;
      setLocalStopStatuses((current) => {
        const next = { ...current };
        delete next[nextStopId];
        return next;
      });
      throw err;
    }
  }, [markStopReached, nextStop, reload, tripId]);

  useEffect(() => {
    if (!tripId || !driverLocation || !nextStop?.coordinate) return;

    const nextStopId = String(nextStop.id);
    if (autoReachedStopIdsRef.current[nextStopId]) return;

    const distanceToNextStop = getDistanceMeters(driverLocation, nextStop.coordinate);
    const dynamicArrivalRadius = Math.max(ARRIVAL_RADIUS_METERS, (locationAccuracy ?? 0) + 20);
    if (distanceToNextStop > dynamicArrivalRadius) return;

    autoReachedStopIdsRef.current[nextStopId] = true;
    setLocalStopStatuses((current) => ({ ...current, [nextStopId]: "reached" }));

    void (async () => {
      try {
        await handleMarkNextStopReached();
      } catch (err) {
        console.warn("[LiveTrip] failed to mark stop reached", err);
      }
    })();
  }, [driverLocation, handleMarkNextStopReached, locationAccuracy, nextStop, tripId]);

  useEffect(() => {
    let mounted = true;

    async function startTracking() {
      if (!tripId) return;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (mounted) {
          setLocationError("Location permission denied. Enable it to use live navigation.");
        }
        return;
      }

      setLocationError(null);

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      if (mounted) {
        setDriverLocation({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
        setLocationAccuracy(current.coords.accuracy ?? null);
      }

      watchSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 8,
          timeInterval: 4000,
        },
        (update) => {
          const point = {
            latitude: update.coords.latitude,
            longitude: update.coords.longitude,
          };
          setDriverLocation(point);
          setLocationAccuracy(update.coords.accuracy ?? null);

          const now = Date.now();
          if (now - lastPingAtRef.current < 15000) return;
          lastPingAtRef.current = now;
          if (pingDisabledRef.current) return;

          void (async () => {
            try {
              await tripsApi.sendLocationPing(tripId, {
                latitude: point.latitude,
                longitude: point.longitude,
                accuracy: update.coords.accuracy ?? undefined,
                heading: update.coords.heading ?? undefined,
                speed: update.coords.speed ?? undefined,
                timestamp: new Date(update.timestamp).toISOString(),
              });
            } catch (err: any) {
              const status = err?.response?.status;
              // Some backend builds don't expose this endpoint yet.
              // Disable further ping attempts to avoid repeated 404 noise.
              if (status === 404) {
                pingDisabledRef.current = true;
                return;
              }
              // Keep non-404 errors silent in UI but visible in logs for debugging.
              console.warn("[LiveTrip] location ping failed", {
                status,
                message: err?.message,
              });
            }
          })();
        },
      );
    }

    void startTracking();

    return () => {
      mounted = false;
      if (watchSubscriptionRef.current) {
        watchSubscriptionRef.current.remove();
        watchSubscriptionRef.current = null;
      }
    };
  }, [tripId]);

  const routeInputPoints = useMemo(() => {
    const points: LatLng[] = [];
    if (driverLocation) points.push(driverLocation);

    for (const stopCoord of remainingStopCoords) {
      if (!points.some((point) => areCoordsClose(point, stopCoord))) {
        points.push(stopCoord);
      }
    }

    if (destinationCoord && !points.some((point) => areCoordsClose(point, destinationCoord))) {
      points.push(destinationCoord);
    }

    return points;
  }, [destinationCoord, driverLocation, remainingStopCoords]);

  const { routeCoords, isFetchingRoute } = useRoutePolyline(routeInputPoints);
  const routeViewportCoords = useMemo(() => {
    const points = routeCoords.length >= 2 ? routeCoords : routeInputPoints;
    return points;
  }, [routeCoords, routeInputPoints]);
  const routeViewportKey = useMemo(
    () => routeInputPoints.map((point) => `${point.latitude}:${point.longitude}`).join("|"),
    [routeInputPoints],
  );

  const mapCoords = useMemo(() => {
    const points: LatLng[] = [];
    if (driverLocation) points.push(driverLocation);
    for (const stop of stopCoords) points.push(stop);
    if (destinationCoord && !points.some((point) => areCoordsClose(point, destinationCoord))) {
      points.push(destinationCoord);
    }
    return points;
  }, [destinationCoord, driverLocation, stopCoords]);

  useEffect(() => {
    if (!mapRef.current || mapCoords.length === 0) return;

    if (!hasInitialFitRef.current) {
      hasInitialFitRef.current = true;
      if (mapCoords.length === 1) {
        mapRef.current.animateToRegion(
          {
            latitude: mapCoords[0].latitude,
            longitude: mapCoords[0].longitude,
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
          },
          500,
        );
        return;
      }

      mapRef.current.fitToCoordinates(mapCoords, {
        edgePadding: { top: 120, right: 36, bottom: 220, left: 36 },
        animated: true,
      });
      return;
    }

    if (routeViewportCoords.length >= 2 && routeViewportKey !== lastFittedRouteKeyRef.current) {
      lastFittedRouteKeyRef.current = routeViewportKey;
      mapRef.current.fitToCoordinates(routeViewportCoords, {
        edgePadding: { top: 120, right: 36, bottom: 220, left: 36 },
        animated: true,
      });
    }
  }, [mapCoords, routeViewportCoords, routeViewportKey]);

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (!tripId || error || !trip) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 dark:bg-[#0B1220] items-center justify-center px-6">
        <Text className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-2">Failed to load live navigation</Text>
        <Text className="text-sm text-gray-500 dark:text-slate-400 text-center mb-5">{error ?? "Trip data is unavailable."}</Text>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => void reload()}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700"
          >
            <Text className="text-gray-800 dark:text-gray-100 font-semibold">Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.back()}
            className="px-4 py-2 rounded-xl bg-brand-600"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-[#0B1220]">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View className="absolute top-10 left-4 right-4 z-20 flex-row items-center justify-between">
        <BackButton />
        <View className="bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-2">
          <Text className="text-xs text-gray-500 dark:text-slate-400">Live Navigation</Text>
          <Text className="text-sm font-bold text-gray-900 dark:text-gray-50">{trip.tripNumber}</Text>
        </View>
      </View>

      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={getRegion(mapCoords)}
        showsUserLocation
        showsMyLocationButton
        showsCompass
      >
        {routeCoords.length >= 2 ? (
          <Polyline coordinates={routeCoords} strokeColor="#1F63E0" strokeWidth={5} />
        ) : routeInputPoints.length >= 2 ? (
          <Polyline coordinates={routeInputPoints} strokeColor="#60A5FA" strokeWidth={3} lineDashPattern={[8, 4]} />
        ) : null}

        {visibleSortedStops.map((stop) => {
          const resolvedStop = resolvedStops.find((item) => String(item.id) === String(stop.id));
          if (!resolvedStop?.coordinate) return null;
          const isNext = Boolean(nextStop && String(nextStop.id) === String(stop.id));
          const normalizedStatus = resolvedStop.effectiveStatus;
          const pinColor =
            isNext
              ? "#F59E0B"
              : normalizedStatus === "reached"
                ? "#16A34A"
                : normalizedStatus === "skipped"
                  ? "#6B7280"
                  : "#2563EB";

          return (
            <Marker
              key={String(stop.id)}
              coordinate={resolvedStop.coordinate}
              title={`Stop #${stop.stopOrder}`}
              description={`${stop.locationName} · ${normalizedStatus}`}
              pinColor={pinColor}
            />
          );
        })}

        {destinationCoord ? (
          <Marker coordinate={destinationCoord} title={destinationAddress || "Destination"} description="Trip destination" pinColor="#DC2626" />
        ) : null}

      </MapView>

      <View className="absolute bottom-5 left-4 right-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-3xl px-4 py-4 shadow-float">
        <Text className="text-[11px] font-semibold tracking-wide text-gray-500 dark:text-slate-400">
          {nextStop ? "Next Stop" : "Destination"}
        </Text>
        <Text className="text-base font-bold text-gray-900 dark:text-gray-50 mt-0.5">
          {nextStop?.locationName || destinationAddress || trip.to || "Destination unavailable"}
        </Text>

        <View className="flex-row items-center justify-between mt-3">
          <Text className="text-xs text-gray-500 dark:text-slate-400">
            {isResolvingStops
              ? "Resolving stop locations..."
              : isResolvingDestination
                ? "Resolving destination..."
                : isFetchingRoute
                  ? "Updating multi-stop route..."
                  : routeInputPoints.length > 2
                    ? `Routing through ${Math.max(routeInputPoints.length - 1, 0)} remaining stops`
                    : "Route ready"}
          </Text>
          {locationAccuracy != null ? (
            <Text className="text-xs text-gray-500 dark:text-slate-400">
              Accuracy ~{Math.round(locationAccuracy)}m
            </Text>
          ) : null}
          {locationError ? (
            <TouchableOpacity onPress={() => Alert.alert("Location", locationError)} className="px-3 py-1.5 rounded-xl bg-red-100">
              <Text className="text-xs text-red-700 font-semibold">Location issue</Text>
            </TouchableOpacity>
          ) : null}
          {!locationError && !driverLocation ? (
            <ActivityIndicator size="small" color={isDark ? "#93C5FD" : "#1F63E0"} />
          ) : null}
        </View>

        {nextStop ? (
          <TouchableOpacity
            onPress={() => {
              void handleMarkNextStopReached().catch((err) => {
                const message = err instanceof Error ? err.message : "Unable to mark the next stop as reached.";
                Alert.alert("Stop Update Failed", message);
              });
            }}
            disabled={isSubmittingTripAction}
            className="mt-4 rounded-2xl bg-teal-700 px-4 py-3"
            style={{ opacity: isSubmittingTripAction ? 0.6 : 1 }}
          >
            <Text className="text-center text-white font-bold">
              {isSubmittingTripAction ? "Updating Stop..." : "Stop Reached"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
