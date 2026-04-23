import { useState, useEffect, useMemo, useRef } from "react";
import { TRIPS_CONFIG } from "../config/trips.config";

type LatLng = { latitude: number; longitude: number };

type UseRoutePolylineResult = {
  routeCoords: LatLng[];
  isFetchingRoute: boolean;
  routeError: string | null;
};

/**
 * Fetches a real road route from OSRM
 * for ordered points (origin → waypoints → destination).
 */
export function useRoutePolyline(points: LatLng[]): UseRoutePolylineResult {
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const validPointsRef = useRef<LatLng[]>([]);

  const validPoints = useMemo(
    () => points.filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)),
    [points],
  );

  useEffect(() => {
    validPointsRef.current = validPoints;
  }, [validPoints]);

  // Use a stable content-based key so the effect doesn't retrigger on equivalent arrays.
  const routeRequestKey = useMemo(
    () =>
      validPoints
        .map((p) => `${p.latitude}:${p.longitude}`)
        .join("|"),
    [validPoints],
  );

  useEffect(() => {
    // Need at least origin + destination
    if (validPointsRef.current.length < 2) {
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
        const currentPoints = validPointsRef.current;

        // Build OSRM URL: coordinates must be in [longitude, latitude] order
        // Format: lng1,lat1;lng2,lat2;lng3,lat3;...
        const coordinates = currentPoints
          .map((p) => `${p.longitude},${p.latitude}`)
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