import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { StatusBar, View } from "react-native";
import MapView from "../components/MapView";

import { useTripDetail } from "@/features/trips/hooks/useTripDetail";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";
import { MapActionButtons } from "../components/Mapactionbuttons";
import { MapHeader } from "../components/Mapheader";
import { TripBottomSheet } from "../components/Tripbottomsheet";
import { TripRouteLayer } from "../components/Triproutelayer";
import { MOCK_TRIP } from "../data/map.data";
import { useMapScreen } from "../hooks/useMaps";
import type { TripRoute } from "../types/maps.types";

function toTripRoute(source: any): TripRoute {
  const stops = Array.isArray(source?.stops) ? source.stops : [];

  const waypoints = stops.map((stop: any, index: number) => ({
    id: stop.id ?? `stop-${index}`,
    label: stop.locationName ?? `Stop ${index + 1}`,
    reached: stop.status === "reached",
    coordinate: {
      latitude: Number(stop.latitude) || 0,
      longitude: Number(stop.longitude) || 0,
    },
  }));

  const origin = {
    id: "origin",
    label: source?.pickupLocation?.address ?? source?.from ?? "Start",
    reached: true,
    coordinate: waypoints[0]?.coordinate ?? { latitude: 0, longitude: 0 },
  };

  const destination = {
    id: "destination",
    label: source?.destinationLocation?.address ?? source?.to ?? "Destination",
    reached: false,
    coordinate: waypoints[waypoints.length - 1]?.coordinate ?? {
      latitude: 0,
      longitude: 0,
    },
  };

  return {
    tripId: source?.id ?? "mock",
    vehicle: source?.vehicle ?? "Assigned vehicle",
    distance: source?.distance ?? "",
    duration: source?.duration ?? "",
    origin,
    destination,
    waypoints,
    polyline: [
      origin.coordinate,
      ...waypoints.map((s) => s.coordinate),
      destination.coordinate,
    ],
  };
}

// ─── MapScreen ────────────────────────────────────────────────────
// Replace MOCK_TRIP with real data from route params:
// const { tripId } = useLocalSearchParams();
// const { trip, isLoading } = useTripDetail(tripId);

export default function MapScreen() {
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const { trip: tripDetail, isLoading } = useTripDetail(tripId);

  const [fallbackTrip] = useState<TripRoute>(MOCK_TRIP);
  const trip = tripDetail ? toTripRoute(tripDetail) : fallbackTrip;

  if (tripId && isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  const {
    mapRef,
    driverLocation,
    routeCoords,
    sheetHeight,
    toggleSheet,
    centerOnDriver,
    fitRoute,
    completedStops,
    totalStops,
  } = useMapScreen(trip);

  return (
    <View className="flex-1">
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {/* ── Full-screen map ── */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        // initialRegion={INITIAL_REGION}
        // customMapStyle={MAP_STYLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        onMapReady={fitRoute}
      >
        <TripRouteLayer
          trip={trip}
          driverLocation={driverLocation}
          routeCoords={routeCoords}
        />
      </MapView>

      {/* ── Top bar (back + vehicle name) ── */}
      <MapHeader vehicle={trip.vehicle} />

      {/* ── Floating action buttons ── */}
      <MapActionButtons onCenterDriver={centerOnDriver} onFitRoute={fitRoute} />

      {/* ── Bottom sheet (trip progress + stops) ── */}
      <TripBottomSheet
        trip={trip}
        sheetHeight={sheetHeight}
        completedStops={completedStops}
        totalStops={totalStops}
        onToggle={toggleSheet}
      />
    </View>
  );
}
