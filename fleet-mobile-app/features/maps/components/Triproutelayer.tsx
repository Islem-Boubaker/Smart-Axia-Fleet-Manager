// components/TripRouteLayer.tsx
import { Marker, Polyline } from "react-native-maps";
import type { TripRoute, Coordinate } from "../types/maps.types";

type Props = {
  trip: TripRoute;
  driverLocation: Coordinate;
  routeCoords: Coordinate[]; // ← add this
};

export function TripRouteLayer({ trip, driverLocation, routeCoords }: Props) {
  return (
    <>
      {/* Real road route */}
      {routeCoords.length > 0 && (
        <Polyline
          coordinates={routeCoords}
          strokeColor="#2D9B6F"
          strokeWidth={4}
        />
      )}

      {/* Stop markers */}
      {trip.stops.map(stop => (
        <Marker
          key={stop.id}
          coordinate={stop.coordinate}
          title={stop.name}
          pinColor={stop.completed ? "green" : "red"}
        />
      ))}

      {/* Driver marker */}
      <Marker coordinate={driverLocation} title="Driver">
        {/* your custom truck icon */}
      </Marker>
    </>
  );
}