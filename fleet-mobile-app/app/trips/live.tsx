import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, StatusBar, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";

import BackButton from "@/shared/components/ui/BackButton";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";
import { useAppTheme } from "@/shared/theme/ThemeProvider";
import { useTripDetail } from "@/features/trips/hooks/useTripDetail";
import { useRoutePolyline } from "@/features/trips/hooks/useRoutePolyline";
import { tripsApi } from "@/features/trips/services/trips.api";

type LatLng = { latitude: number; longitude: number };

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

function getRegion(coords: LatLng[]) {
  if (coords.length === 0) {
    return { latitude: 36.8065, longitude: 10.1815, latitudeDelta: 0.25, longitudeDelta: 0.25 };
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

  const params = useLocalSearchParams<{ tripId?: string | string[] }>();
  const tripId = Array.isArray(params.tripId) ? params.tripId[0] : params.tripId;

  const { trip, isLoading, error, reload } = useTripDetail(tripId);
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [destinationCoord, setDestinationCoord] = useState<LatLng | null>(null);
  const [nextStopTargetCoord, setNextStopTargetCoord] = useState<LatLng | null>(null);
  const [isResolvingDestination, setIsResolvingDestination] = useState(false);
  const [isResolvingNextStop, setIsResolvingNextStop] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);

  const destinationAddress = useMemo(
    () => toAddress(trip?.destinationLocation) || trip?.to || "",
    [trip?.destinationLocation, trip?.to],
  );

  const sortedStops = useMemo(() => {
    return [...(trip?.stops ?? [])].sort((a, b) => a.stopOrder - b.stopOrder);
  }, [trip?.stops]);

  const nextStop = useMemo(() => {
    const pending = sortedStops.find((stop) => normalizeStopStatus(stop.status) === "pending");
    if (pending) return pending;

    // Fallback: if backend status is missing/unknown, guide to first unresolved stop by order.
    return (
      sortedStops.find((stop) => {
        const status = normalizeStopStatus(stop.status);
        return status !== "reached" && status !== "skipped";
      }) ?? null
    );
  }, [sortedStops]);

  const nextStopCoord = useMemo(() => {
    if (!nextStop) return null;
    if (nextStop.latitude == null || nextStop.longitude == null) return null;
    return {
      latitude: nextStop.latitude as number,
      longitude: nextStop.longitude as number,
    };
  }, [nextStop]);

  const stopCoords = useMemo(() => {
    return sortedStops
      .filter((stop) => stop.latitude != null && stop.longitude != null)
      .map((stop) => ({ latitude: stop.latitude as number, longitude: stop.longitude as number }));
  }, [sortedStops]);

  useEffect(() => {
    let cancelled = false;

    async function resolveDestination() {
      if (!trip) {
        setDestinationCoord(null);
        return;
      }

      setIsResolvingDestination(true);
      const fallbackFromStops = stopCoords.length > 0 ? stopCoords[stopCoords.length - 1] : null;

      try {
        if (!destinationAddress) {
          setDestinationCoord(fallbackFromStops);
          return;
        }

        const searchText = destinationAddress.toLowerCase().includes("tunisia")
          ? destinationAddress
          : `${destinationAddress}, Tunisia`;

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&limit=1&addressdetails=1&countrycodes=tn`,
          {
            headers: {
              Accept: "application/json",
              "User-Agent": "SmartAxiaFleetManager/1.0 (mobile-app)",
            },
          },
        );

        if (!response.ok) {
          setDestinationCoord(fallbackFromStops);
          return;
        }

        const results = (await response.json()) as { lat: string; lon: string; display_name?: string }[];
        if (!Array.isArray(results) || results.length === 0) {
          setDestinationCoord(fallbackFromStops);
          return;
        }

        const lat = Number.parseFloat(results[0].lat);
        const lng = Number.parseFloat(results[0].lon);
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
          setDestinationCoord(fallbackFromStops);
          return;
        }

        if (!cancelled) {
          setDestinationCoord({ latitude: lat, longitude: lng });
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
  }, [destinationAddress, stopCoords, trip]);

  useEffect(() => {
    let cancelled = false;

    async function resolveNextStopTarget() {
      if (!nextStop) {
        setNextStopTargetCoord(null);
        return;
      }

      if (nextStopCoord) {
        setNextStopTargetCoord(nextStopCoord);
        return;
      }

      const candidate = String(nextStop.locationName ?? "").trim();
      if (!candidate) {
        setNextStopTargetCoord(null);
        return;
      }

      setIsResolvingNextStop(true);
      try {
        const searchText = candidate.toLowerCase().includes("tunisia")
          ? candidate
          : `${candidate}, Tunisia`;

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&limit=1&addressdetails=1&countrycodes=tn`,
          {
            headers: {
              Accept: "application/json",
              "User-Agent": "SmartAxiaFleetManager/1.0 (mobile-app)",
            },
          },
        );

        if (!response.ok) {
          setNextStopTargetCoord(null);
          return;
        }

        const results = (await response.json()) as { lat: string; lon: string }[];
        if (!Array.isArray(results) || results.length === 0) {
          setNextStopTargetCoord(null);
          return;
        }

        const lat = Number.parseFloat(results[0].lat);
        const lng = Number.parseFloat(results[0].lon);
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
          setNextStopTargetCoord(null);
          return;
        }

        if (!cancelled) {
          setNextStopTargetCoord({ latitude: lat, longitude: lng });
        }
      } catch {
        if (!cancelled) {
          setNextStopTargetCoord(null);
        }
      } finally {
        if (!cancelled) setIsResolvingNextStop(false);
      }
    }

    void resolveNextStopTarget();
    return () => {
      cancelled = true;
    };
  }, [nextStop, nextStopCoord]);

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
    if (nextStopTargetCoord) {
      points.push(nextStopTargetCoord);
      return points;
    }
    if (destinationCoord) points.push(destinationCoord);
    return points;
  }, [destinationCoord, driverLocation, nextStopTargetCoord]);

  const { routeCoords, isFetchingRoute } = useRoutePolyline(routeInputPoints);

  const mapCoords = useMemo(() => {
    const points: LatLng[] = [];
    if (driverLocation) points.push(driverLocation);
    for (const stop of stopCoords) points.push(stop);
    if (nextStopTargetCoord && !nextStopCoord) points.push(nextStopTargetCoord);
    if (destinationCoord) points.push(destinationCoord);
    return points;
  }, [destinationCoord, driverLocation, nextStopCoord, nextStopTargetCoord, stopCoords]);

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

    if (driverLocation) {
      mapRef.current.animateToRegion(
        {
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        700,
      );
    }
  }, [driverLocation, mapCoords]);

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

        {sortedStops.map((stop) => {
          if (stop.latitude == null || stop.longitude == null) return null;
          const isNext = Boolean(nextStop && String(nextStop.id) === String(stop.id));
          const normalizedStatus = normalizeStopStatus(stop.status);
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
              coordinate={{ latitude: stop.latitude as number, longitude: stop.longitude as number }}
              title={`Stop #${stop.stopOrder}`}
              description={stop.locationName}
              pinColor={pinColor}
            />
          );
        })}

        {destinationCoord ? (
          <Marker coordinate={destinationCoord} title={destinationAddress || "Destination"} description="Trip destination" pinColor="#DC2626" />
        ) : null}

        {nextStop && nextStopTargetCoord && !nextStopCoord ? (
          <Marker
            coordinate={nextStopTargetCoord}
            title={`Next stop #${nextStop.stopOrder}`}
            description={nextStop.locationName}
            pinColor="#F59E0B"
          />
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
            {isResolvingNextStop
              ? "Resolving next stop..."
              : isResolvingDestination
                ? "Resolving destination..."
                : isFetchingRoute
                  ? "Updating route..."
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
      </View>
    </SafeAreaView>
  );
}
