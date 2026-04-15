// import React, { useRef, useState } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   Dimensions,
//   Animated,
//   PanResponder,
//   ScrollView,
//   LayoutAnimation,
//   UIManager,
//   Platform,
// } from "react-native";
// import MapView, { Marker, Polyline } from "react-native-maps";
// import { useNavigation, useLocalSearchParams } from "expo-router";
// import { BlurView } from "expo-blur";
// import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react-native";

// if (Platform.OS === "android") {
//   UIManager.setLayoutAnimationEnabledExperimental?.(true);
// }

// const { height } = Dimensions.get("window");

// const SHEET_PEEK = 64;
// const SHEET_FULL = height * 0.52;

// const staticStops = [
//   {
//     id: "1",
//     stopOrder: 1,
//     locationName: "Hammamet Interchange",
//     estimatedArrival: "08:45",
//     status: "reached",
//     notes: "Fuel checkpoint",
//   },
//   {
//     id: "2",
//     stopOrder: 2,
//     locationName: "Sousse North Station",
//     estimatedArrival: "09:30",
//     status: "reached",
//     notes: "Fuel pickup",
//   },
//   {
//     id: "3",
//     stopOrder: 3,
//     locationName: "El Alem Depot",
//     estimatedArrival: "10:10",
//     status: "skipped",
//     notes: "Road blocked",
//   },
//   {
//     id: "4",
//     stopOrder: 4,
//     locationName: "Sfax Industrial Zone",
//     estimatedArrival: "11:00",
//     status: "pending",
//     notes: "Delivery point",
//   },
// ];

// const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
//   pending: { bg: "#FEF3C7", text: "#92400E" },
//   reached: { bg: "#D1FAE5", text: "#065F46" },
//   skipped: { bg: "#FEE2E2", text: "#991B1B" },
// };

// const DOT_COLORS: Record<string, string> = {
//   pending: "#6B7280",
//   reached: "#22C55E",
//   skipped: "#EF4444",
// };

// export default function TripDetailScreen() {
//   const navigation = useNavigation();
//   const { id } = useLocalSearchParams();
//   console.log("Trip ID:", id);
//   const [sheetExpanded, setSheetExpanded] = useState(true);
//   const [stopsOpen, setStopsOpen] = useState(true);

//   const sheetHeight = useRef(new Animated.Value(SHEET_FULL)).current;

//   const animateTo = (toValue: number, expanded: boolean) => {
//     Animated.spring(sheetHeight, {
//       toValue,
//       useNativeDriver: false,
//       bounciness: 4,
//     }).start();
//     setSheetExpanded(expanded);
//   };

//   const panResponder = useRef(
//     PanResponder.create({
//       onStartShouldSetPanResponder: () => false,
//       onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8,
//       onPanResponderMove: (_, gesture) => {
//         const base = sheetExpanded ? SHEET_FULL : SHEET_PEEK;
//         const newHeight = base - gesture.dy;
//         const clamped = Math.max(SHEET_PEEK, Math.min(SHEET_FULL, newHeight));
//         sheetHeight.setValue(clamped);
//       },
//       onPanResponderRelease: (_, gesture) => {
//         const threshold = 60;
//         if (gesture.dy < -threshold) {
//           animateTo(SHEET_FULL, true);
//         } else if (gesture.dy > threshold) {
//           animateTo(SHEET_PEEK, false);
//         } else {
//           animateTo(sheetExpanded ? SHEET_FULL : SHEET_PEEK, sheetExpanded);
//         }
//       },
//     })
//   ).current;

//   const toggleStops = () => {
//     LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
//     setStopsOpen(!stopsOpen);
//   };

//   const tripData = {
//     vehicle: { model: "Toyota Hilux", plateNumber: "AX-99281-K" },
//     driver: { name: "Mohamed Ali" },
//     stats: { distance: 120, estimatedFuel: 15, timeRemaining: 45 },
//     route: {
//       pickupLocation: { address: "Tunis Centre" },
//       deliveryLocation: { address: "Sfax" },
//     },
//   };

//   const routeCoordinates = [
//     { latitude: 36.8065, longitude: 10.1815 },
//     { latitude: 36.8185, longitude: 10.1895 },
//     { latitude: 36.8325, longitude: 10.2065 },
//     { latitude: 36.8485, longitude: 10.2245 },
//     { latitude: 36.8625, longitude: 10.2425 },
//   ];

//   return (
//     <View style={{ flex: 1 }}>
//       {/* MAP — full screen background */}
//       <MapView
//         style={{ flex: 1 }}
//         initialRegion={{
//           latitude: 36.8325,
//           longitude: 10.2065,
//           latitudeDelta: 0.05,
//           longitudeDelta: 0.05,
//         }}
//       >
//         <Marker coordinate={routeCoordinates[0]} pinColor="green" />
//         <Marker
//           coordinate={routeCoordinates[routeCoordinates.length - 1]}
//           pinColor="red"
//         />
//         <Polyline
//           coordinates={routeCoordinates}
//           strokeColor="#6B21F5"
//           strokeWidth={5}
//         />
//       </MapView>

//       {/* HEADER — floats above map */}
//       <View
//         style={{
//           position: "absolute",
//           top: 24,
//           left: 16,
//           right: 16,
//           flexDirection: "row",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <BlurView intensity={80} tint="light" style={{ borderRadius: 12 }}>
//           <TouchableOpacity
//             onPress={() => navigation.goBack()}
//             style={{ padding: 10 }}
//           >
//             <ArrowLeft size={22} color="#1F2937" />
//           </TouchableOpacity>
//         </BlurView>

//         <View
//           style={{
//             backgroundColor: "white",
//             paddingHorizontal: 14,
//             paddingVertical: 8,
//             borderRadius: 14,
//           }}
//         >
//           <Text style={{ color: "#7c3aed", fontWeight: "600" }}>
//             {tripData.vehicle.plateNumber}
//           </Text>
//         </View>
//       </View>

//       {/* BOTTOM SHEET — floats above map */}
//       <Animated.View
//         style={{
//           height: sheetHeight,
//           position: "absolute",
//           bottom: 0,
//           left: 0,
//           right: 0,
//           backgroundColor: "white",
//           borderTopLeftRadius: 24,
//           borderTopRightRadius: 24,
//           shadowColor: "#000",
//           shadowOffset: { width: 0, height: -4 },
//           shadowOpacity: 0.08,
//           shadowRadius: 12,
//           elevation: 10,
//         }}
//       >
//         {/* Drag handle — pan responder only here */}
//         <View
//           {...panResponder.panHandlers}
//           style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}
//         >
//           <View
//             style={{
//               width: 40,
//               height: 4,
//               backgroundColor: "#D1D5DB",
//               borderRadius: 2,
//             }}
//           />
//         </View>

//         {/* Toggle button — tap only, no pan conflict */}
//         <TouchableOpacity
//           onPress={() =>
//             animateTo(
//               sheetExpanded ? SHEET_PEEK : SHEET_FULL,
//               !sheetExpanded
//             )
//           }
//           style={{
//             alignSelf: "center",
//             marginTop: 2,
//             marginBottom: 6,
//             paddingHorizontal: 16,
//             paddingVertical: 5,
//             backgroundColor: "#F3F4F6",
//             borderRadius: 20,
//           }}
//         >
//           <Text style={{ fontSize: 12, color: "#6B7280" }}>
//             {sheetExpanded ? "▼ collapse" : "▲ expand"}
//           </Text>
//         </TouchableOpacity>

//         {/* Scrollable content */}
//         <ScrollView
//           style={{ flex: 1, paddingHorizontal: 16 }}
//           showsVerticalScrollIndicator={false}
//         >
//           {/* Title */}
//           <Text style={{ fontSize: 18, fontWeight: "600", color: "#111827" }}>
//             {tripData.vehicle.model}{" "}
//             <Text style={{ color: "#9CA3AF", fontWeight: "400" }}>
//               · {tripData.vehicle.plateNumber}
//             </Text>
//           </Text>
//           <Text style={{ color: "#6B7280", fontSize: 13, marginTop: 2 }}>
//             {tripData.route.pickupLocation.address} →{" "}
//             {tripData.route.deliveryLocation.address}
//           </Text>

//           {/* Driver row */}
//           <View
//             style={{
//               flexDirection: "row",
//               alignItems: "center",
//               marginTop: 10,
//               gap: 8,
//             }}
//           >
//             <View
//               style={{
//                 width: 28,
//                 height: 28,
//                 borderRadius: 14,
//                 backgroundColor: "#EDE9FE",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               <Text style={{ fontSize: 11, fontWeight: "500", color: "#7c3aed" }}>
//                 MA
//               </Text>
//             </View>
//             <Text style={{ color: "#6B7280", fontSize: 13 }}>
//               {tripData.driver.name}
//             </Text>
//             <View
//               style={{
//                 marginLeft: "auto",
//                 backgroundColor: "#D1FAE5",
//                 paddingHorizontal: 10,
//                 paddingVertical: 3,
//                 borderRadius: 20,
//               }}
//             >
//               <Text style={{ fontSize: 11, color: "#065F46", fontWeight: "500" }}>
//                 ongoing
//               </Text>
//             </View>
//           </View>

//           {/* Stats */}
//           <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
//             {[
//               { label: "distance", value: `${tripData.stats.distance} km` },
//               { label: "fuel est.", value: `${tripData.stats.estimatedFuel} L` },
//               { label: "ETA", value: `${tripData.stats.timeRemaining} min` },
//             ].map((s) => (
//               <View
//                 key={s.label}
//                 style={{
//                   flex: 1,
//                   backgroundColor: "#F9FAFB",
//                   borderRadius: 10,
//                   padding: 10,
//                 }}
//               >
//                 <Text style={{ fontSize: 10, color: "#9CA3AF" }}>{s.label}</Text>
//                 <Text style={{ fontSize: 15, fontWeight: "500", marginTop: 2, color: "#111827" }}>
//                   {s.value}
//                 </Text>
//               </View>
//             ))}
//           </View>

//           {/* Stops header */}
//           <TouchableOpacity
//             onPress={toggleStops}
//             style={{
//               flexDirection: "row",
//               justifyContent: "space-between",
//               alignItems: "center",
//               marginTop: 16,
//               paddingVertical: 4,
//             }}
//           >
//             <Text style={{ fontSize: 14, fontWeight: "500", color: "#111827" }}>
//               Trip stops
//             </Text>
//             <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
//               <View
//                 style={{
//                   backgroundColor: "#F3F4F6",
//                   paddingHorizontal: 8,
//                   paddingVertical: 2,
//                   borderRadius: 20,
//                 }}
//               >
//                 <Text style={{ fontSize: 11, color: "#6B7280" }}>
//                   {staticStops.length} stops
//                 </Text>
//               </View>
//               {stopsOpen ? (
//                 <ChevronUp size={16} color="#9CA3AF" />
//               ) : (
//                 <ChevronDown size={16} color="#9CA3AF" />
//               )}
//             </View>
//           </TouchableOpacity>

//           {/* Stops list */}
//           {stopsOpen && (
//             <View style={{ marginTop: 4 }}>
//               {staticStops.map((stop, index) => (
//                 <View key={stop.id} style={{ flexDirection: "row", gap: 10 }}>
//                   {/* Timeline */}
//                   <View style={{ alignItems: "center", width: 18 }}>
//                     <View
//                       style={{
//                         width: 12,
//                         height: 12,
//                         borderRadius: 6,
//                         backgroundColor: DOT_COLORS[stop.status],
//                         borderWidth: 2,
//                         borderColor: "white",
//                         marginTop: 6,
//                       }}
//                     />
//                     {index < staticStops.length - 1 && (
//                       <View
//                         style={{
//                           width: 2,
//                           flex: 1,
//                           minHeight: 20,
//                           marginTop: 2,
//                           backgroundColor: "#E5E7EB",
//                         }}
//                       />
//                     )}
//                   </View>

//                   {/* Stop content */}
//                   <View
//                     style={{
//                       flex: 1,
//                       paddingBottom: 12,
//                       borderBottomWidth: index < staticStops.length - 1 ? 0.5 : 0,
//                       borderBottomColor: "#F3F4F6",
//                     }}
//                   >
//                     <Text
//                       style={{
//                         fontSize: 13,
//                         fontWeight: "500",
//                         color: "#111827",
//                       }}
//                     >
//                       {stop.locationName}
//                     </Text>
//                     <Text
//                       style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}
//                     >
//                       Est. {stop.estimatedArrival} · Order {stop.stopOrder}
//                       {stop.notes ? ` · ${stop.notes}` : ""}
//                     </Text>
//                     <View
//                       style={{
//                         alignSelf: "flex-start",
//                         marginTop: 4,
//                         backgroundColor: STATUS_STYLES[stop.status].bg,
//                         paddingHorizontal: 8,
//                         paddingVertical: 2,
//                         borderRadius: 20,
//                       }}
//                     >
//                       <Text
//                         style={{
//                           fontSize: 10,
//                           fontWeight: "500",
//                           color: STATUS_STYLES[stop.status].text,
//                         }}
//                       >
//                         {stop.status}
//                       </Text>
//                     </View>
//                   </View>
//                 </View>
//               ))}
//             </View>
//           )}

//           {/* CTA */}
//           <TouchableOpacity
//             style={{
//               marginTop: 16,
//               marginBottom: 24,
//               backgroundColor: "#6B21F5",
//               padding: 14,
//               borderRadius: 16,
//             }}
//           >
//             <Text
//               style={{
//                 color: "white",
//                 textAlign: "center",
//                 fontWeight: "500",
//                 fontSize: 15,
//               }}
//             >
//               Start Navigation
//             </Text>
//           </TouchableOpacity>
//         </ScrollView>
//       </Animated.View>
//     </View>
//   );
// }

import React, { useRef, useState } from "react";
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
import { useNavigation, useLocalSearchParams, useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { Accordion } from "../components/ui/Accordion"; 
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Fuel,
  Gauge,
  RefreshCw,
} from "lucide-react-native";
import { useTripDetail } from "../hooks/useTripDetail";
import type { TripStop, UiTripStatus } from "../types/trip.types";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const { height } = Dimensions.get("window");

const SHEET_PEEK = 64;
const SHEET_FULL = height * 0.52;

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FEF3C7", text: "#92400E" },
  reached: { bg: "#D1FAE5", text: "#065F46" },
  skipped: { bg: "#FEE2E2", text: "#991B1B" },
};

const TRIP_STATUS_STYLES: Record<UiTripStatus, { bg: string; text: string }> = {
  pending: { bg: "#EFF6FF", text: "#1D4ED8" },
  active: { bg: "#D1FAE5", text: "#065F46" },
  completed: { bg: "#F3F4F6", text: "#374151" },
};

const DOT_COLORS: Record<string, string> = {
  pending: "#9CA3AF",
  reached: "#22C55E",
  skipped: "#EF4444",
};

const LINE_COLORS: Record<string, string> = {
  pending: "#E5E7EB",
  reached: "#BBF7D0",
  skipped: "#FECACA",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function getRegion(stops: TripStop[]) {
  const coords = stops.filter((s) => s.latitude != null && s.longitude != null);
  if (coords.length === 0) {
    return { latitude: 36.8065, longitude: 10.1815, latitudeDelta: 0.5, longitudeDelta: 0.5 };
  }
  const lats = coords.map((c) => c.latitude as number);
  const lngs = coords.map((c) => c.longitude as number);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.05, (maxLat - minLat) * 1.4),
    longitudeDelta: Math.max(0.05, (maxLng - minLng) * 1.4),
  };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TripDetailScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // ← Single source of truth: the hook owns all data/loading/error state
  const { trip, isLoading, error, reload } = useTripDetail(id);

  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [stopsOpen, setStopsOpen] = useState(true);
  const sheetHeight = useRef(new Animated.Value(SHEET_FULL)).current;

  // ── Sheet animation ──────────────────────────────────────────────────────
  const animateTo = (toValue: number, expanded: boolean) => {
    Animated.spring(sheetHeight, {
      toValue,
      useNativeDriver: false,
      bounciness: 4,
    }).start();
    setSheetExpanded(expanded);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8,
      onPanResponderMove: (_, g) => {
        const base = sheetExpanded ? SHEET_FULL : SHEET_PEEK;
        const clamped = Math.max(SHEET_PEEK, Math.min(SHEET_FULL, base - g.dy));
        sheetHeight.setValue(clamped);
      },
      onPanResponderRelease: (_, g) => {
        const threshold = 60;
        if (g.dy < -threshold) animateTo(SHEET_FULL, true);
        else if (g.dy > threshold) animateTo(SHEET_PEEK, false);
        else animateTo(sheetExpanded ? SHEET_FULL : SHEET_PEEK, sheetExpanded);
      },
    })
  ).current;

  const toggleStops = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStopsOpen((v) => !v);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB" }}>
        <ActivityIndicator size="large" color="#6B21F5" />
        <Text style={{ marginTop: 12, color: "#6B7280", fontSize: 14 }}>Loading trip…</Text>
      </View>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
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
            style={{
              backgroundColor: "#EDE9FE",
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <RefreshCw size={14} color="#7c3aed" />
            <Text style={{ color: "#7c3aed", fontWeight: "500" }}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ backgroundColor: "#6B21F5", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ color: "white", fontWeight: "500" }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Derived values ───────────────────────────────────────────────────────
  const stops = trip.stops ?? [];
  const validCoords = stops.filter((s) => s.latitude != null && s.longitude != null);
  const routeCoordinates = validCoords.map((s) => ({
    latitude: s.latitude as number,
    longitude: s.longitude as number,
  }));
  const sortedStops = [...stops].sort((a, b) => a.stopOrder - b.stopOrder);
  const mapRegion = getRegion(stops);
  const tripStatus = trip.status;
  const backendStatus = trip.backendStatus ?? "scheduled";
  const statusStyle = TRIP_STATUS_STYLES[tripStatus] ?? TRIP_STATUS_STYLES.pending;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>

      {/* ── MAP ── */}
      <MapView style={{ flex: 1 }} region={mapRegion}>
        {routeCoordinates.length >= 2 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#6B21F5"
            strokeWidth={4}
          />
        )}
        {validCoords.map((stop, i) => (
          <Marker
            key={stop.id}
            coordinate={{ latitude: stop.latitude!, longitude: stop.longitude! }}
            title={stop.locationName}
            description={`Stop ${stop.stopOrder} · ${stop.status}`}
            pinColor={
              i === 0 ? "#22C55E" : i === validCoords.length - 1 ? "#EF4444" : "#6B21F5"
            }
          />
        ))}
      </MapView>

      {/* ── FLOATING HEADER ── */}
      <View
        style={{
          position: "absolute",
          top: 52,
          left: 16,
          right: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <BlurView intensity={80} tint="light" style={{ borderRadius: 12, overflow: "hidden" }}>
          <TouchableOpacity onPress={() => router.goBack()} style={{ padding: 10 }}>
            <ArrowLeft size={22} color="#1F2937" />
          </TouchableOpacity>
        </BlurView>

        <BlurView intensity={80} tint="light" style={{ borderRadius: 14, overflow: "hidden" }}>
          <View style={{ paddingHorizontal: 14, paddingVertical: 8 }}>
            <Text style={{ color: "#7c3aed", fontWeight: "700", fontSize: 13 }}>
              {trip.tripNumber}
            </Text>
          </View>
        </BlurView>
      </View>

      {/* ── BOTTOM SHEET ── */}
      <Animated.View
        style={{
          height: sheetHeight,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "white",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 12,
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

