import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  ScrollView,
  LayoutAnimation,
  UIManager,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { Accordion } from "../components/ui/Accordion";
import { ArrowLeft, ChevronDown, ChevronUp, Clock, Fuel, Gauge, RefreshCw } from "lucide-react-native";
import { useTripDetail } from "../hooks/useTripDetail";
import { useTripActions } from "../hooks/useTripActions";
import { useRoutePolyline } from "../hooks/useRoutePolyline"; // ← new
import { normalizeAddressKey, resolveTunisiaAddressToCoord } from "../utils/geocoding";
import { filterDestinationDuplicateStops } from "../utils/routeDedup";
import type { UiTripStatus } from "../types/trip.types";
import { useAppTheme } from "@/shared/theme/ThemeProvider";
import { tripsApi } from "../services/trips.api";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const { height } = Dimensions.get("window");
const SHEET_PEEK = 64;
const SHEET_FULL = height * 0.52;
type LatLng = { latitude: number; longitude: number };

// ─── Constants ────────────────────────────────────────────────────────────────

const TRIP_STATUS_STYLES: Record<UiTripStatus, { bg: string; text: string }> = {
  pending:   { bg: "#EFF6FF", text: "#1D4ED8" },
  active:    { bg: "#D1FAE5", text: "#065F46" },
  completed: { bg: "#F3F4F6", text: "#374151" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  catch { return "—"; }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

function getRegion(coords: LatLng[]) {
  if (coords.length === 0) {
    return { latitude: 36.8065, longitude: 10.1815, latitudeDelta: 0.5, longitudeDelta: 0.5 };
  }
  const lats = coords.map((c) => c.latitude);
  const lngs = coords.map((c) => c.longitude);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  return {
    latitude:      (minLat + maxLat) / 2,
    longitude:     (minLng + maxLng) / 2,
    latitudeDelta:  Math.max(0.05, (maxLat - minLat) * 1.4),
    longitudeDelta: Math.max(0.05, (maxLng - minLng) * 1.4),
  };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TripDetailScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const mapRef = useRef<MapView | null>(null);
  const geocodeCache = useRef<Record<string, LatLng>>({});
  const colors = useMemo(
    () => ({
      pageBg: isDark ? "#0B1220" : "#F9FAFB",
      surface: isDark ? "#0F172A" : "#FFFFFF",
      mutedSurface: isDark ? "#1E293B" : "#F3F4F6",
      softSurface: isDark ? "#111827" : "#F9FAFB",
      border: isDark ? "#334155" : "#E5E7EB",
      text: isDark ? "#F8FAFC" : "#111827",
      subtext: isDark ? "#94A3B8" : "#6B7280",
      icon: isDark ? "#CBD5E1" : "#1F2937",
      blurTint: isDark ? "dark" : "light",
      sheetShadow: isDark ? "#020617" : "#000000",
      primary: "#6B21F5",
      primarySoft: isDark ? "#312E81" : "#EDE9FE",
      routeDraft: isDark ? "#8B5CF6" : "#C4B5FD",
    }),
    [isDark],
  );

  const handleGoBack = () => {
    if (router.canGoBack()) { router.back(); return; }
    router.replace("/(tabs)/trips");
  };

  const normalizedTripId = Array.isArray(id) ? id[0] : id;
  const { trip, isLoading, error, reload } = useTripDetail(normalizedTripId);
  const { markStopReached, isSubmitting: isSubmittingTripAction } = useTripActions();

  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [stopsOpen, setStopsOpen]         = useState(true);
  const [originCoord, setOriginCoord] = useState<LatLng | null>(null);
  const [destinationCoord, setDestinationCoord] = useState<LatLng | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const sheetHeight = useRef(new Animated.Value(SHEET_FULL)).current;

  const stops = useMemo(() => trip?.stops ?? [], [trip?.stops]);
  const sortedStops = useMemo(() => [...stops].sort((a, b) => a.stopOrder - b.stopOrder), [stops]);
  const validStops = useMemo(
    () => sortedStops.filter((s) => s.latitude != null && s.longitude != null),
    [sortedStops],
  );

  const originAddress = useMemo(() => {
    const maybeAddress = trip?.pickupLocation?.address?.trim();
    if (maybeAddress) return maybeAddress;
    return trip?.from?.trim() ?? "";
  }, [trip?.pickupLocation?.address, trip?.from]);

  const destinationAddress = useMemo(() => {
    const maybeAddress = trip?.destinationLocation?.address?.trim();
    if (maybeAddress) return maybeAddress;
    return trip?.to?.trim() ?? "";
  }, [trip?.destinationLocation?.address, trip?.to]);

  const stopNameCoordsMap = useMemo(() => {
    const map: Record<string, LatLng> = {};
    for (const stop of validStops) {
      const key = normalizeAddressKey(stop.locationName);
      if (!map[key]) {
        map[key] = {
          latitude: stop.latitude as number,
          longitude: stop.longitude as number,
        };
      }
    }
    return map;
  }, [validStops]);

  const originCoordsFromTrip = useMemo(() => {
    if (trip?.pickupLocation?.latitude != null && trip?.pickupLocation?.longitude != null) {
      return {
        latitude: trip.pickupLocation.latitude,
        longitude: trip.pickupLocation.longitude,
      };
    }
    if (trip?.startLatitude != null && trip?.startLongitude != null) {
      return {
        latitude: trip.startLatitude,
        longitude: trip.startLongitude,
      };
    }
    return null;
  }, [trip?.pickupLocation?.latitude, trip?.pickupLocation?.longitude, trip?.startLatitude, trip?.startLongitude]);

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
  }, [trip?.destinationLocation?.latitude, trip?.destinationLocation?.longitude, trip?.endLatitude, trip?.endLongitude]);

  const visibleStops = useMemo(() => {
    return filterDestinationDuplicateStops(sortedStops, destinationAddress, destinationCoordsFromTrip);
  }, [destinationAddress, destinationCoordsFromTrip, sortedStops]);
  const nextPendingStop = useMemo(
    () => visibleStops.find((stop) => stop.status === "pending") ?? null,
    [visibleStops],
  );

  React.useEffect(() => {
    let isCancelled = false;

    const geocodeAddress = async (address: string): Promise<LatLng | null> => {
      return resolveTunisiaAddressToCoord(address, geocodeCache.current);
    };

    const resolveFromStopName = (address: string): LatLng | null => {
      const key = normalizeAddressKey(address);
      return stopNameCoordsMap[key] ?? null;
    };

    const resolveEndpoints = async () => {
      if (!originAddress && !destinationAddress) {
        setOriginCoord(null);
        setDestinationCoord(null);
        return;
      }

      if (originCoordsFromTrip || destinationCoordsFromTrip) {
        setOriginCoord(originCoordsFromTrip ?? resolveFromStopName(originAddress));
        setDestinationCoord(destinationCoordsFromTrip ?? resolveFromStopName(destinationAddress));
        setIsGeocoding(false);
        return;
      }

      setIsGeocoding(true);
      const [origin, destination] = await Promise.all([
        geocodeAddress(originAddress),
        geocodeAddress(destinationAddress),
      ]);

      if (isCancelled) return;

      setOriginCoord(origin ?? resolveFromStopName(originAddress));
      setDestinationCoord(destination ?? resolveFromStopName(destinationAddress));
      setIsGeocoding(false);
    };

    void resolveEndpoints();

    return () => {
      isCancelled = true;
    };
  }, [destinationAddress, destinationCoordsFromTrip, originAddress, originCoordsFromTrip, stopNameCoordsMap]);

  const allMarkerCoords = useMemo(() => {
    const points: LatLng[] = [];
    if (originCoord) points.push(originCoord);
    for (const stop of visibleStops) {
      if (stop.latitude == null || stop.longitude == null) continue;
      points.push({
        latitude: stop.latitude as number,
        longitude: stop.longitude as number,
      });
    }
    if (destinationCoord) points.push(destinationCoord);
    return points;
  }, [destinationCoord, originCoord, visibleStops]);
  const validCoords = useMemo(
    () => visibleStops.filter((s) => s.latitude != null && s.longitude != null),
    [visibleStops],
  );

  const routePathCoords = useMemo(() => allMarkerCoords, [allMarkerCoords]);

  // ── Real road route ───────────────────────────────────────────────────────
  const { routeCoords, isFetchingRoute } = useRoutePolyline(routePathCoords);

  React.useEffect(() => {
    if (!mapRef.current || allMarkerCoords.length === 0) return;

    if (allMarkerCoords.length === 1) {
      mapRef.current.animateToRegion(
        {
          latitude: allMarkerCoords[0].latitude,
          longitude: allMarkerCoords[0].longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        },
        400,
      );
      return;
    }

    requestAnimationFrame(() => {
      mapRef.current?.fitToCoordinates(allMarkerCoords, {
        edgePadding: {
          top: 110,
          right: 48,
          bottom: 220,
          left: 48,
        },
        animated: true,
      });
    });
  }, [allMarkerCoords]);

  // ── Sheet animation ───────────────────────────────────────────────────────
  const animateTo = (toValue: number, expanded: boolean) => {
    Animated.spring(sheetHeight, { toValue, useNativeDriver: false, bounciness: 4 }).start();
    setSheetExpanded(expanded);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder:  (_, g) => Math.abs(g.dy) > 8,
      onPanResponderMove: (_, g) => {
        const base    = sheetExpanded ? SHEET_FULL : SHEET_PEEK;
        const clamped = Math.max(SHEET_PEEK, Math.min(SHEET_FULL, base - g.dy));
        sheetHeight.setValue(clamped);
      },
      onPanResponderRelease: (_, g) => {
        const threshold = 60;
        if      (g.dy < -threshold) animateTo(SHEET_FULL, true);
        else if (g.dy >  threshold) animateTo(SHEET_PEEK, false);
        else animateTo(sheetExpanded ? SHEET_FULL : SHEET_PEEK, sheetExpanded);
      },
    })
  ).current;

  const toggleStops = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStopsOpen((v) => !v);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB" }}>
      
        <ActivityIndicator size="large" color="#6B21F5" />
        <Text style={{ marginTop: 12, color: colors.subtext, fontSize: 14 }}>Loading trip…</Text>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !trip) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.pageBg, padding: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
          Failed to load trip
        </Text>
        <Text style={{ color: colors.subtext, fontSize: 13, textAlign: "center" }}>
          {error ?? "Trip not found"}
        </Text>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
          <TouchableOpacity
            onPress={reload}
            style={{ backgroundColor: colors.primarySoft, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={14} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "500" }}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleGoBack}
            style={{ backgroundColor: "#6B21F5", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ color: "white", fontWeight: "500" }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const mapRegion   = getRegion(allMarkerCoords);

  const backendStatus = trip.backendStatus ?? "scheduled";
  const statusStyle   = TRIP_STATUS_STYLES[trip.status] ?? TRIP_STATUS_STYLES.pending;

  const handleStartTrip = async () => {
    if (!trip?.id) return;
    if (backendStatus !== "scheduled") return;

    try {
      setIsNavigating(true);
      await tripsApi.startTrip(trip.id);
      await reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to start trip right now.";
      Alert.alert("Start Trip Failed", message);
    } finally {
      setIsNavigating(false);
    }
  };

  const handleNavigateToLiveTrip = () => {
    if (!trip?.id) return;
    if (backendStatus !== "ongoing") return;

    router.push({
      pathname: "/trips/live",
      params: { tripId: trip.id },
    });
  };

  const handleMarkNextStopReached = async () => {
    if (!trip?.id || !nextPendingStop?.id) return;

    try {
      await markStopReached(trip.id, nextPendingStop.id, new Date().toISOString());
      await reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to mark the next stop as reached.";
      Alert.alert("Stop Update Failed", message);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>

      {/* ── MAP ── */}
      <MapView ref={mapRef} style={{ flex: 1 }} initialRegion={mapRegion}>

        {/* Real road polyline — shown once fetched */}
        {routeCoords.length >= 2 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#6B21F5"
            strokeWidth={4}
          />
        )}

        {/* Fallback straight-line polyline while route is loading */}
        {isFetchingRoute && routePathCoords.length >= 2 && (
          <Polyline
            coordinates={routePathCoords}
            strokeColor={colors.routeDraft}
            strokeWidth={2}
            lineDashPattern={[6, 4]}
          />
        )}

        {originCoord && (
          <Marker
            coordinate={originCoord}
            title={originAddress || "Start"}
            description="Start location"
            pinColor="#22C55E"
          />
        )}

        {validCoords.map((stop) => (
          <Marker
            key={stop.id}
            coordinate={{ latitude: stop.latitude!, longitude: stop.longitude! }}
            title={`Stop ${stop.stopOrder}: ${stop.locationName}`}
            description={`Stop ${stop.stopOrder} · ${stop.status}`}
            pinColor="#2563EB"
          />
        ))}

        {destinationCoord && (
          <Marker
            coordinate={destinationCoord}
            title={destinationAddress || "End"}
            description="Destination"
            pinColor="#DC2626"
          />
        )}
      </MapView>

      {/* ── FLOATING HEADER ── */}
      <View
        style={{
          position: "absolute", top: 52, left: 16, right: 16,
          flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <BlurView intensity={80} tint={colors.blurTint as "light" | "dark"} style={{ borderRadius: 12, overflow: "hidden" }}>
          <TouchableOpacity onPress={handleGoBack} style={{ padding: 10 }}>
            <ArrowLeft size={22} color={colors.icon} />
          </TouchableOpacity>
        </BlurView>

        <BlurView intensity={80} tint={colors.blurTint as "light" | "dark"} style={{ borderRadius: 14, overflow: "hidden" }}>
          <View style={{ paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
              {trip.tripNumber}
            </Text>
            {/* Route loading indicator in header */}
            {(isFetchingRoute || isGeocoding) && <ActivityIndicator size="small" color={colors.primary} />}
          </View>
        </BlurView>
      </View>

      {/* ── BOTTOM SHEET ── */}
      <Animated.View
        style={{
          height: sheetHeight,
          position: "absolute", bottom: 0, left: 0, right: 0,
          backgroundColor: colors.surface,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          shadowColor: colors.sheetShadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.35 : 0.1, shadowRadius: 16, elevation: 12,
        }}
      >
        {/* Drag handle */}
         <View
          {...panResponder.panHandlers}
          style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}
        >
          <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2 }} />
        </View>

        {/* Collapse / expand pill */}
        <TouchableOpacity
          onPress={() => animateTo(sheetExpanded ? SHEET_PEEK : SHEET_FULL, !sheetExpanded)}
          style={{
            alignSelf: "center",
            marginTop: 2,
            marginBottom: 6,
            paddingHorizontal: 16,
            paddingVertical: 5,
            backgroundColor: colors.mutedSurface,
            borderRadius: 20,
          }}
        >
          <Text style={{ fontSize: 11, color: colors.subtext }}>
            {sheetExpanded ? "▼ collapse" : "▲ expand"}
          </Text>
        </TouchableOpacity>

        {/* ── Scrollable content ── */}
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>

          {/* Vehicle + route + status badge */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
                {trip.vehicle}
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 2 }}>
                {trip.pickupLocation.address} → {trip.destinationLocation.address}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: statusStyle.bg,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
                alignSelf: "flex-start",
              }}
            >
              <Text style={{ fontSize: 11, color: statusStyle.text, fontWeight: "600", textTransform: "capitalize" }}>
                {backendStatus}
              </Text>
            </View>
          </View>

          {/* Date / time */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 }}>
            <Clock size={12} color={colors.subtext} />
            <Text style={{ fontSize: 12, color: colors.subtext }}>
              {formatDate(trip.scheduledTime ?? trip.actualStartTime)} · {formatTime(trip.scheduledTime ?? trip.actualStartTime)}
              {trip.actualEndTime ? ` → ${formatTime(trip.actualEndTime)}` : ""}
            </Text>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <StatCard icon={<Gauge size={14} color={colors.primary} />} label="distance" value={trip.distance} isDark={isDark} />
            <StatCard icon={<Fuel size={14} color={colors.primary} />} label="fuel" value={trip.fuel ?? "—"} isDark={isDark} />
            <StatCard icon={<Clock size={14} color={colors.primary} />} label="fare" value={trip.fare != null ? `${trip.fare} TND` : "—"} isDark={isDark} />
          </View>

          {/* ── Stops header ── */}
          <TouchableOpacity
            onPress={toggleStops}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 18,
            
            
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>Trip stops</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ backgroundColor: colors.mutedSurface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
                <Text style={{ fontSize: 11, color: colors.subtext }}>
                  {visibleStops.length} {visibleStops.length === 1 ? "stop" : "stops"}
                </Text>
              </View>
              {stopsOpen ? <ChevronUp size={16} color={colors.subtext} /> : <ChevronDown size={16} color={colors.subtext} />}
            </View>
          </TouchableOpacity>

       
          {/* Stops list */}
          {stopsOpen && visibleStops.length > 0 && (
            <View style={{ marginTop: 8 }}>
  
              <View style={{ marginTop: 16 }}>
               
                <Accordion
                  items={visibleStops.map((stop) => ({
                    title: `Stop ${stop.stopOrder}: ${stop.locationName}`,
                    content: stop.notes ?? null,
                  }))}
                  defaultOpenIndex={0}
                />
              </View>
            </View>
          )}

          {backendStatus === "scheduled" && (
            <TouchableOpacity
              style={{
                marginTop: 18,
                backgroundColor: colors.primary,
                padding: 15,
                borderRadius: 16,
                opacity: isNavigating ? 0.6 : 1,
              }}
              disabled={isNavigating}
              onPress={() => void handleStartTrip()}
            >
              <Text
                style={{
                  color: "white",
                  textAlign: "center",
                  fontWeight: "700",
                  fontSize: 15,
                }}
              >
                {isNavigating ? "Starting Trip..." : "Start Trip"}
              </Text>
            </TouchableOpacity>
          )}

          {backendStatus === "ongoing" && nextPendingStop && (
            <TouchableOpacity
              style={{
                marginTop: 18,
                backgroundColor: "#0F766E",
                padding: 15,
                borderRadius: 16,
                opacity: isSubmittingTripAction ? 0.6 : 1,
              }}
              disabled={isSubmittingTripAction}
              onPress={() => void handleMarkNextStopReached()}
            >
              <Text
                style={{
                  color: "white",
                  textAlign: "center",
                  fontWeight: "700",
                  fontSize: 15,
                }}
              >
                {isSubmittingTripAction
                  ? "Updating Stop..."
                  : `Stop Reached${nextPendingStop.locationName ? ` · ${nextPendingStop.locationName}` : ""}`}
              </Text>
            </TouchableOpacity>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={{
              marginTop: 18,
              marginBottom: 32,
              backgroundColor: backendStatus === "ongoing" ? colors.primary : colors.mutedSurface,
              padding: 15,
              borderRadius: 16,
              opacity: backendStatus === "ongoing" ? 1 : 0.5,
            }}
            disabled={backendStatus !== "ongoing"}
            onPress={handleNavigateToLiveTrip}
          >
            <Text
              style={{
                color: backendStatus === "ongoing" ? "white" : isDark ? "#94A3B8" : "#6B7280",
                textAlign: "center",
                fontWeight: "600",
                fontSize: 15,
              }}
            >
              {backendStatus === "ongoing"
                ? "Navigate Now"
                : backendStatus === "scheduled"
                ? "Trip Not Started Yet"
                : backendStatus === "completed"
                ? "Trip Completed"
                : "Trip Cancelled"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}




// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, isDark }: { icon: React.ReactNode; label: string; value: string; isDark: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#111827" : "#F9FAFB", borderRadius: 12, padding: 10, gap: 4, borderWidth: isDark ? 1 : 0, borderColor: isDark ? "#334155" : "transparent" }}>
      {icon}
      <Text style={{ fontSize: 10, color: isDark ? "#94A3B8" : "#9CA3AF", marginTop: 2 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: "600", color: isDark ? "#F8FAFC" : "#111827" }}>{value}</Text>
    </View>
  );
}
