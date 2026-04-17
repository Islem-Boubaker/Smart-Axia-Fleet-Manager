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
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { Accordion } from "../components/ui/Accordion";
import { ArrowLeft, ChevronDown, ChevronUp, Clock, Fuel, Gauge, RefreshCw } from "lucide-react-native";
import { useTripDetail } from "../hooks/useTripDetail";
import { useRoutePolyline } from "../hooks/useRoutePolyline"; // ← new
import type { TripStop, UiTripStatus } from "../types/trip.types";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const { height } = Dimensions.get("window");
const SHEET_PEEK = 64;
const SHEET_FULL = height * 0.52;

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

function getRegion(stops: TripStop[]) {
  const coords = stops.filter((s) => s.latitude != null && s.longitude != null);
  if (coords.length === 0) {
    return { latitude: 36.8065, longitude: 10.1815, latitudeDelta: 0.5, longitudeDelta: 0.5 };
  }
  const lats = coords.map((c) => c.latitude as number);
  const lngs = coords.map((c) => c.longitude as number);
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
  const { id } = useLocalSearchParams<{ id: string }>();

  const handleGoBack = () => {
    if (router.canGoBack()) { router.back(); return; }
    router.replace("/(tabs)/trips");
  };

  const normalizedTripId = Array.isArray(id) ? id[0] : id;
  const { trip, isLoading, error, reload } = useTripDetail(normalizedTripId);

  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [stopsOpen, setStopsOpen]         = useState(true);
  const sheetHeight = useRef(new Animated.Value(SHEET_FULL)).current;

  const stops = useMemo(() => trip?.stops ?? [], [trip?.stops]);

  // ── Real road route ───────────────────────────────────────────────────────
  const { routeCoords, isFetchingRoute } = useRoutePolyline(stops);

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
        <Text style={{ marginTop: 12, color: "#6B7280", fontSize: 14 }}>Loading trip…</Text>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !trip) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB", padding: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 8 }}>
          Failed to load trip
        </Text>
        <Text style={{ color: "#6B7280", fontSize: 13, textAlign: "center" }}>
          {error ?? "Trip not found"}
        </Text>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
          <TouchableOpacity
            onPress={reload}
            style={{ backgroundColor: "#EDE9FE", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={14} color="#7c3aed" />
            <Text style={{ color: "#7c3aed", fontWeight: "500" }}>Retry</Text>
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
  const validCoords = stops.filter((s) => s.latitude != null && s.longitude != null);
  const sortedStops = [...stops].sort((a, b) => a.stopOrder - b.stopOrder);
  const mapRegion   = getRegion(stops);

  const backendStatus = trip.backendStatus ?? "scheduled";
  const statusStyle   = TRIP_STATUS_STYLES[trip.status] ?? TRIP_STATUS_STYLES.pending;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>

      {/* ── MAP ── */}
      <MapView style={{ flex: 1 }} region={mapRegion}>

        {/* Real road polyline — shown once fetched */}
        {routeCoords.length >= 2 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#6B21F5"
            strokeWidth={4}
          />
        )}

        {/* Fallback straight-line polyline while route is loading */}
        {isFetchingRoute && validCoords.length >= 2 && (
          <Polyline
            coordinates={validCoords.map((s) => ({
              latitude:  s.latitude  as number,
              longitude: s.longitude as number,
            }))}
            strokeColor="#C4B5FD"   // lighter purple = "draft"
            strokeWidth={2}
            lineDashPattern={[6, 4]}
          />
        )}

        {/* Markers: green = origin, red = destination, purple = middle stops */}
        {validCoords.map((stop, i) => (
          <Marker
            key={stop.id}
            coordinate={{ latitude: stop.latitude!, longitude: stop.longitude! }}
            title={stop.locationName}
            description={`Stop ${stop.stopOrder} · ${stop.status}`}
            pinColor={
              i === 0                        ? "#22C55E"  // origin
              : i === validCoords.length - 1 ? "#EF4444"  // destination
              : "#6B21F5"                                 // waypoint
            }
          />
        ))}
      </MapView>

      {/* ── FLOATING HEADER ── */}
      <View
        style={{
          position: "absolute", top: 52, left: 16, right: 16,
          flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <BlurView intensity={80} tint="light" style={{ borderRadius: 12, overflow: "hidden" }}>
          <TouchableOpacity onPress={handleGoBack} style={{ padding: 10 }}>
            <ArrowLeft size={22} color="#1F2937" />
          </TouchableOpacity>
        </BlurView>

        <BlurView intensity={80} tint="light" style={{ borderRadius: 14, overflow: "hidden" }}>
          <View style={{ paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ color: "#7c3aed", fontWeight: "700", fontSize: 13 }}>
              {trip.tripNumber}
            </Text>
            {/* Route loading indicator in header */}
            {isFetchingRoute && <ActivityIndicator size="small" color="#7c3aed" />}
          </View>
        </BlurView>
      </View>

      {/* ── BOTTOM SHEET ── */}
      <Animated.View
        style={{
          height: sheetHeight,
          position: "absolute", bottom: 0, left: 0, right: 0,
          backgroundColor: "white",
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1, shadowRadius: 16, elevation: 12,
        }}
      >
        {/* Drag handle */}
         <View
          {...panResponder.panHandlers}
          style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}
        >
          <View style={{ width: 40, height: 4, backgroundColor: "#D1D5DB", borderRadius: 2 }} />
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
            backgroundColor: "#F3F4F6",
            borderRadius: 20,
          }}
        >
          <Text style={{ fontSize: 11, color: "#6B7280" }}>
            {sheetExpanded ? "▼ collapse" : "▲ expand"}
          </Text>
        </TouchableOpacity>

        {/* ── Scrollable content ── */}
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>

          {/* Vehicle + route + status badge */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: "#111827" }}>
                {trip.vehicle}
              </Text>
              <Text style={{ color: "#9CA3AF", fontSize: 12, marginTop: 2 }}>
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
            <Clock size={12} color="#9CA3AF" />
            <Text style={{ fontSize: 12, color: "#9CA3AF" }}>
              {formatDate(trip.scheduledTime ?? trip.actualStartTime)} · {formatTime(trip.scheduledTime ?? trip.actualStartTime)}
              {trip.actualEndTime ? ` → ${formatTime(trip.actualEndTime)}` : ""}
            </Text>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <StatCard icon={<Gauge size={14} color="#7c3aed" />} label="distance" value={trip.distance} />
            <StatCard icon={<Fuel size={14} color="#7c3aed" />} label="fuel" value={trip.fuel ?? "—"} />
            <StatCard icon={<Clock size={14} color="#7c3aed" />} label="fare" value={trip.fare != null ? `${trip.fare} TND` : "—"} />
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
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827" }}>Trip stops</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ backgroundColor: "#F3F4F6", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
                <Text style={{ fontSize: 11, color: "#6B7280" }}>
                  {stops.length} {stops.length === 1 ? "stop" : "stops"}
                </Text>
              </View>
              {stopsOpen ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
            </View>
          </TouchableOpacity>

       
          {/* Stops list */}
          {stopsOpen && stops.length > 0 && (
            <View style={{ marginTop: 8 }}>
  
              <View style={{ marginTop: 16 }}>
               
                <Accordion
                  items={sortedStops.map((stop) => ({
                    title: `Stop ${stop.stopOrder}: ${stop.locationName}`,
                    content: stop.notes ?? null,
                  }))}
                  defaultOpenIndex={0}
                />
              </View>
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={{
              marginTop: 18,
              marginBottom: 32,
              backgroundColor: backendStatus === "ongoing" ? "#6B21F5" : "#F3F4F6",
              padding: 15,
              borderRadius: 16,
              opacity: backendStatus === "cancelled" || backendStatus === "completed" ? 0.5 : 1,
            }}
            disabled={backendStatus === "cancelled" || backendStatus === "completed"}
          >
            <Text
              style={{
                color: backendStatus === "ongoing" ? "white" : "#374151",
                textAlign: "center",
                fontWeight: "600",
                fontSize: 15,
              }}
            >
              {backendStatus === "ongoing"
                ? "Navigate Now"
                : backendStatus === "scheduled"
                ? "Start Trip"
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

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB", borderRadius: 12, padding: 10, gap: 4 }}>
      {icon}
      <Text style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827" }}>{value}</Text>
    </View>
  );
}