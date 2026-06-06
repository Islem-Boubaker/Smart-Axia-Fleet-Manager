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
  I18nManager,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { Accordion } from "../components/ui/Accordion";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Clock, Fuel, Gauge, RefreshCw } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useTripDetail } from "../hooks/useTripDetail";
import { useTripActions } from "../hooks/useTripActions";
import { useRoutePolyline } from "../hooks/useRoutePolyline"; // ← new
import { normalizeAddressKey, resolveTunisiaAddressToCoord } from "../utils/geocoding";
import { filterDestinationDuplicateStops } from "../utils/routeDedup";
import type { UiTripStatus } from "../types/trip.types";
import { useAppTheme } from "@/shared/theme/ThemeProvider";
import { tripsApi } from "../services/trips.api";
import { getStatusTranslationKey } from "@/shared/utils/translateStatus";
import { OpenStreetMapView, type OpenStreetMapMarker, type OpenStreetMapPolyline } from "@/shared/components/maps/OpenStreetMapView";

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

function isFiniteCoord(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TripDetailScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
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
    () => sortedStops.filter((s) => isFiniteCoord(s.latitude) && isFiniteCoord(s.longitude)),
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
      if (!isFiniteCoord(stop.latitude) || !isFiniteCoord(stop.longitude)) continue;
      const key = normalizeAddressKey(stop.locationName);
      if (!map[key]) {
        map[key] = {
          latitude: stop.latitude,
          longitude: stop.longitude,
        };
      }
    }
    return map;
  }, [validStops]);

  const originCoordsFromTrip = useMemo(() => {
    if (isFiniteCoord(trip?.pickupLocation?.latitude) && isFiniteCoord(trip?.pickupLocation?.longitude)) {
      return {
        latitude: trip.pickupLocation.latitude,
        longitude: trip.pickupLocation.longitude,
      };
    }
    if (isFiniteCoord(trip?.startLatitude) && isFiniteCoord(trip?.startLongitude)) {
      return {
        latitude: trip.startLatitude,
        longitude: trip.startLongitude,
      };
    }
    return null;
  }, [trip?.pickupLocation?.latitude, trip?.pickupLocation?.longitude, trip?.startLatitude, trip?.startLongitude]);

  const destinationCoordsFromTrip = useMemo(() => {
    if (isFiniteCoord(trip?.destinationLocation?.latitude) && isFiniteCoord(trip?.destinationLocation?.longitude)) {
      return {
        latitude: trip.destinationLocation.latitude,
        longitude: trip.destinationLocation.longitude,
      };
    }
    if (isFiniteCoord(trip?.endLatitude) && isFiniteCoord(trip?.endLongitude)) {
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
      if (!isFiniteCoord(stop.latitude) || !isFiniteCoord(stop.longitude)) continue;
      points.push({
        latitude: stop.latitude,
        longitude: stop.longitude,
      });
    }
    if (destinationCoord) points.push(destinationCoord);
    return points;
  }, [destinationCoord, originCoord, visibleStops]);
  const validCoords = useMemo(
    () => visibleStops.filter((s) => isFiniteCoord(s.latitude) && isFiniteCoord(s.longitude)),
    [visibleStops],
  );

  const routePathCoords = useMemo(() => allMarkerCoords, [allMarkerCoords]);

  // ── Real road route ───────────────────────────────────────────────────────
  const { routeCoords, isFetchingRoute } = useRoutePolyline(routePathCoords);

  const mapMarkers = useMemo<OpenStreetMapMarker[]>(() => {
    const markers: OpenStreetMapMarker[] = [];
    if (originCoord) {
      markers.push({
        id: "origin",
        coordinate: originCoord,
        color: "#22C55E",
        label: originAddress || t("trips.start"),
      });
    }

    for (const stop of validCoords) {
      markers.push({
        id: `stop-${stop.id}`,
        coordinate: { latitude: stop.latitude!, longitude: stop.longitude! },
        color: "#2563EB",
        label: stop.locationName,
      });
    }

    if (destinationCoord) {
      markers.push({
        id: "destination",
        coordinate: destinationCoord,
        color: "#DC2626",
        label: destinationAddress || t("trips.end"),
      });
    }

    return markers;
  }, [destinationAddress, destinationCoord, originAddress, originCoord, t, validCoords]);

  const mapPolylines = useMemo<OpenStreetMapPolyline[]>(() => {
    if (routeCoords.length >= 2) {
      return [{ id: "route", coordinates: routeCoords, color: "#6B21F5", width: 4 }];
    }

    if (routePathCoords.length >= 2) {
      return [{ id: "route-draft", coordinates: routePathCoords, color: colors.routeDraft, width: 3, dashed: true }];
    }

    return [];
  }, [colors.routeDraft, routeCoords, routePathCoords]);

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
        <Text style={{ marginTop: 12, color: colors.subtext, fontSize: 14 }}>{t("trips.loadingTrip")}</Text>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !trip) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.pageBg, padding: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
          {t("trips.failedToLoad")}
        </Text>
        <Text style={{ color: colors.subtext, fontSize: 13, textAlign: "center" }}>
          {error ?? t("trips.notFound")}
        </Text>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
          <TouchableOpacity
            onPress={reload}
            style={{ backgroundColor: colors.primarySoft, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={14} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "500" }}>{t("shared.retry")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleGoBack}
            style={{ backgroundColor: "#6B21F5", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ color: "white", fontWeight: "500" }}>{t("shared.goBack")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
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
      const message = err instanceof Error ? err.message : t("trips.errors.startTrip");
      Alert.alert(t("trips.errors.startTripTitle"), message);
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
      const message = err instanceof Error ? err.message : t("trips.errors.stopUpdate");
      Alert.alert(t("trips.errors.stopUpdateTitle"), message);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>

      {/* ── MAP ── */}
      <OpenStreetMapView
        markers={mapMarkers}
        polylines={mapPolylines}
        fallbackLabel={isGeocoding || isFetchingRoute ? t("trips.loadingRoute") : `${trip.from} → ${trip.to}`}
      />

      {/* ── FLOATING HEADER ── */}
      <View
        style={{
          position: "absolute", top: 52, left: 16, right: 16,
          flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <BlurView intensity={80} tint={colors.blurTint as "light" | "dark"} style={{ borderRadius: 12, overflow: "hidden" }}>
          <TouchableOpacity onPress={handleGoBack} style={{ padding: 10 }}>
            {I18nManager.isRTL ? <ArrowRight size={22} color={colors.icon} /> : <ArrowLeft size={22} color={colors.icon} />}
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
            {sheetExpanded ? t("trips.live.collapse") : t("trips.live.expand")}
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
                {originAddress || "—"} → {destinationAddress || "—"}
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
                {t(getStatusTranslationKey(backendStatus))}
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
            <StatCard icon={<Gauge size={14} color={colors.primary} />} label={t("trips.distance")} value={trip.distance} isDark={isDark} />
            <StatCard icon={<Fuel size={14} color={colors.primary} />} label={t("trips.fuel")} value={trip.fuel ?? "—"} isDark={isDark} />
            <StatCard icon={<Clock size={14} color={colors.primary} />} label={t("trips.fare")} value={trip.fare != null ? `${trip.fare} TND` : "—"} isDark={isDark} />
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
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{t("trips.tripStops")}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ backgroundColor: colors.mutedSurface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
                <Text style={{ fontSize: 11, color: colors.subtext }}>
                  {t(visibleStops.length === 1 ? "trips.stopCount" : "trips.stopsWithCount", { count: visibleStops.length })}
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
                    title: t("trips.stopWithNumber", { number: stop.stopOrder, name: stop.locationName }),
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
                {isNavigating ? t("trips.startingTrip") : t("trips.startTrip")}
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
                  ? t("trips.live.updatingStop")
                  : nextPendingStop.locationName
                    ? t("trips.live.stopReachedWithName", { name: nextPendingStop.locationName })
                    : t("trips.live.stopReached")}
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
                ? t("trips.live.navigateNow")
                : backendStatus === "scheduled"
                ? t("trips.notStartedYet")
                : backendStatus === "completed"
                ? t("trips.completed")
                : t("trips.cancelled")}
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
