import type { TripRoute } from "../types/maps.types";

type Coordinate = { latitude: number; longitude: number };

type Props = {
  trip: TripRoute;
  driverLocation: Coordinate;
  routeCoords: Coordinate[];
};

export function TripRouteLayer(_props: Props) {
  return null;
}
