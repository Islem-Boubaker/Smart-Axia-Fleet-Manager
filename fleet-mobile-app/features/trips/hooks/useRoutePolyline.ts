import { useState, useEffect, useMemo, useRef } from "react";
import { TRIPS_CONFIG } from "../config/trips.config";
import type { TripStop } from "../types/trip.types";

type LatLng = { latitude: number; longitude: number };

type UseRoutePolylineResult = {
  routeCoords: LatLng[];
  isFetchingRoute: boolean;
  routeError: string | null;
};

/**
 * Fetches a real road route from Google Directions API
 * for all ordered stops (origin → waypoints → destination).
 */
export function useRoutePolyline(stops: TripStop[]): UseRoutePolylineResult {
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const validStopsRef = useRef<TripStop[]>([]);

  const validStops = useMemo(
    () =>
      [...stops]
        .sort((a, b) => a.stopOrder - b.stopOrder)
        .filter((s) => s.latitude != null && s.longitude != null),
    [stops]
  );

  useEffect(() => {
    validStopsRef.current = validStops;
  }, [validStops]);

  // Use a stable content-based key so the effect doesn't retrigger on equivalent arrays.
  const routeRequestKey = useMemo(
    () =>
      validStops
        .map((s) => `${s.id}:${s.stopOrder}:${s.latitude}:${s.longitude}`)
        .join("|"),
    [validStops]
  );

  useEffect(() => {
    // Need at least origin + destination
    if (validStopsRef.current.length < 2) {
      setIsFetchingRoute(false);
      setRouteError(null);
      setRouteCoords((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    const controller = new AbortController();

    async function fetchRoute() {
      setIsFetchingRoute(true);
      setRouteError(null);

      try {
        const currentStops = validStopsRef.current;

        // Build OSRM URL: coordinates must be in [longitude, latitude] order
        // Format: lng1,lat1;lng2,lat2;lng3,lat3;...
        const coordinates = currentStops
          .map((s) => `${s.longitude},${s.latitude}`)
          .join(";");

        const url = `${TRIPS_CONFIG.OSRM_BASE_URL}/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

        const response = await fetch(url, { signal: controller.signal });
        const data = await response.json();

        if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
          setRouteError(`OSRM API: ${data.code || "No route found"}`);
          return;
        }

        // OSRM returns coordinates as [longitude, latitude] in GeoJSON format
        // Convert to { latitude, longitude } for React Native Maps
        const routeGeometry = data.routes[0].geometry;
        const osrmCoords = routeGeometry.coordinates || [];

        const convertedCoords: LatLng[] = osrmCoords.map(([lng, lat]: [number, number]) => ({
          latitude: lat,
          longitude: lng,
        }));

        setRouteCoords(convertedCoords);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setRouteError("Failed to fetch route");
        }
      } finally {
        setIsFetchingRoute(false);
      }
    }

    fetchRoute();
    return () => controller.abort();
  }, [routeRequestKey]);

  return { routeCoords, isFetchingRoute, routeError };
}