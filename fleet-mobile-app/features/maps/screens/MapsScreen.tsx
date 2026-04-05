import React, { useState } from "react";
import { View, StatusBar } from "react-native";
import MapView from "../components/MapView";


import { useMapScreen } from "../hooks/useMaps";
import { MOCK_TRIP, INITIAL_REGION, MAP_STYLE } from "../data/map.data";
import { MapHeader } from "../components/Mapheader";
import { MapActionButtons } from "../components/Mapactionbuttons";
import { TripRouteLayer } from "../components/Triproutelayer";
import { TripBottomSheet } from "../components/Tripbottomsheet";
import type { TripRoute } from "../types/maps.types";

// ─── MapScreen ────────────────────────────────────────────────────
// Replace MOCK_TRIP with real data from route params:
// const { tripId } = useLocalSearchParams();
// const { trip, isLoading } = useTripDetail(tripId);

export default function MapScreen() {
  const [trip] = useState<TripRoute>(MOCK_TRIP);

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
      <MapActionButtons
        onCenterDriver={centerOnDriver}
        onFitRoute={fitRoute}
      />

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

