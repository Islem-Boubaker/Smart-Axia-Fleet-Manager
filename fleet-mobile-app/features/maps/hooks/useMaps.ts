// import { useRef, useState, useEffect } from "react";
// import { Animated, Dimensions } from "react-native";
// import MapView from "react-native-maps";
// import * as Location from "expo-location";
// import type { TripRoute } from "../types/maps.types";

// const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// export const SHEET_COLLAPSED = SCREEN_HEIGHT * 0.08;
// export const SHEET_EXPANDED  = SCREEN_HEIGHT * 0.32;

// export function useMapScreen(trip: TripRoute) {
//   const mapRef = useRef<MapView>(null);

//   // Driver GPS location
//   const [driverLocation, setDriverLocation] =
//     useState<{ latitude: number; longitude: number } | null>(null);

//   // Bottom sheet open/close
//   const [sheetOpen, setSheetOpen] = useState(true);
//   const sheetAnim = useRef(new Animated.Value(1)).current;

//   const sheetHeight = sheetAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: [SHEET_COLLAPSED, SHEET_EXPANDED],
//   });

//   const toggleSheet = () => {
//     const toValue = sheetOpen ? 0 : 1;
//     Animated.spring(sheetAnim, {
//       toValue,
//       useNativeDriver: false,
//       friction: 8,
//     }).start();
//     setSheetOpen((prev) => !prev);
//   };

//   // Request location + watch position
//   useEffect(() => {
//     let subscription: Location.LocationSubscription | null = null;

//     (async () => {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== "granted") return;

//       const loc = await Location.getCurrentPositionAsync({});
//       setDriverLocation({
//         latitude: loc.coords.latitude,
//         longitude: loc.coords.longitude,
//       });

//       subscription = await Location.watchPositionAsync(
//         { accuracy: Location.Accuracy.High, distanceInterval: 10 },
//         (loc) => {
//           setDriverLocation({
//             latitude: loc.coords.latitude,
//             longitude: loc.coords.longitude,
//           });
//         }
//       );
//     })();

//     return () => { subscription?.remove(); };
//   }, []);

//   // Center map on driver's position
//   const centerOnDriver = () => {
//     if (!driverLocation) return;
//     mapRef.current?.animateToRegion(
//       { ...driverLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 },
//       600
//     );
//   };

//   // Fit entire route in view
//   const fitRoute = () => {
//     mapRef.current?.fitToCoordinates(trip.polyline, {
//       edgePadding: { top: 80, right: 40, bottom: 260, left: 40 },
//       animated: true,
//     });
//   };

//   // Progress counters
//   const completedStops = [trip.origin, ...trip.waypoints].filter(
//     (s) => s.reached
//   ).length;
//   const totalStops = [trip.origin, ...trip.waypoints, trip.destination].length;

//   return {
//     mapRef,
//     driverLocation,
//     sheetOpen,
//     sheetHeight,
//     toggleSheet,
//     centerOnDriver,
//     fitRoute,
//     completedStops,
//     totalStops,
//   };
// }



// hooks/useMaps.ts
import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import type { TripRoute } from "../types/maps.types";
import type MapView from "react-native-maps";

export function useMapScreen(trip: TripRoute) {
  const mapRef = useRef<MapView>(null);
  const sheetHeight = useRef(new Animated.Value(200)).current;
  const [routeCoords, setRouteCoords] = useState(trip.routeCoords);
  const [driverLocation, setDriverLocation] = useState(trip.stops[0].coordinate);

  // ── Fetch real road route from OSRM ──
  useEffect(() => {
    const fetchRoute = async () => {
      const stops = trip.stops;
      
      // Build waypoints string: lng,lat;lng,lat;...
      const waypoints = stops
        .map(s => `${s.coordinate.longitude},${s.coordinate.latitude}`)
        .join(";");

      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`
      );
      const data = await res.json();

      if (data.routes?.[0]) {
        const coords = data.routes[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })
        );
        setRouteCoords(coords);
      }
    };

    fetchRoute();
  }, [trip]);

  // ── Fit all stops in view ──
  const fitRoute = () => {
    mapRef.current?.fitToCoordinates(
      trip.stops.map(s => s.coordinate),
      { edgePadding: { top: 100, right: 50, bottom: 300, left: 50 }, animated: true }
    );
  };

  // ── Center on driver ──
  const centerOnDriver = () => {
    mapRef.current?.animateToRegion({
      ...driverLocation,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }, 500);
  };

  // ── Toggle bottom sheet ──
  const toggleSheet = () => {
    Animated.spring(sheetHeight, {
      toValue: sheetHeight._value > 200 ? 200 : 400,
      useNativeDriver: false,
    }).start();
  };

  const completedStops = trip.stops.filter(s => s.completed).length;
  const totalStops = trip.stops.length;

  return {
    mapRef,
    driverLocation,
    routeCoords,   // ← pass this to TripRouteLayer
    sheetHeight,
    toggleSheet,
    centerOnDriver,
    fitRoute,
    completedStops,
    totalStops,
  };
}