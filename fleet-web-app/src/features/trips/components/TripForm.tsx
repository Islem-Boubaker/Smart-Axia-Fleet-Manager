import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import type { LeafletMouseEvent } from 'leaflet';
import { useTranslation } from 'react-i18next';
import 'leaflet/dist/leaflet.css';
import { FiZap } from 'react-icons/fi';
import { Button, Input, Select } from '../../../shared/components';
import type { Driver, Vehicle } from '../../../types';
import { tripsService } from '../services/trips.service';
import { formatLocationFromAddress } from '../utils/locationLabel';

// ─── ETA consistency: Option A ──────────────────────────────────────────────
// Stop estimated arrivals = pure driving time from start (no buffer).
// The trip-level "endTime" (ETA field) = driving time + ETA_BUFFER_SECONDS.
// Buffer is intentionally NOT applied to individual stops so the driver sees
// realistic road-time targets per stop, while the global ETA has slack built in.
// ────────────────────────────────────────────────────────────────────────────

type TripFormValues = {
  vehicleId: string;
  userId: string;
  startLocation: string;
  endLocation: string;
  startTime: string;
  endTime: string;
  region: string;
  requiredCapacity: string;
  distance: string;
  revenue: string;
};

interface TripFormProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  dark?: boolean;
  isSubmitting?: boolean;
  onSubmit: (data: {
    vehicleId: string;
    userId: string;
    startLocation: string;
    startLatitude?: number;
    startLongitude?: number;
    endLocation: string;
    endLatitude?: number;
    endLongitude?: number;
    startTime: string;
    endTime?: string;
    region?: string;
    requiredCapacity?: number;
    distance: number;
    fuel?: number;
    revenue?: number;
    stops?: Array<{
      locationName: string;
      stopOrder: number;
      latitude?: number;
      longitude?: number;
      notes?: string;
      estimatedArrival?: string;
    }>;
  }) => Promise<void> | void;
  onCancel: () => void;
}

type MapPoint = {
  lat: number;
  lng: number;
};

type PickerTarget = 'start' | 'end';

// estimatedArrival is now derived from routePlan; removed from Endpoint state
// to avoid the circular dependency (optimizeRoute effect reads endpoints).
type Endpoint = {
  id: string;
  label: string;
  point: MapPoint | null;
  notes: string;
};

// etaOffsetSeconds: seconds after trip startTime at which this stop is reached
// (driving time only — no ETA buffer — see Option A comment at top of file).
// null means timing could not be computed for this stop.
type RoutePlanStop = {
  endpointId: string;
  label: string;
  point: MapPoint;
  etaOffsetSeconds: number | null;
};

type RoutePlan = {
  distanceKm: number;
  durationSeconds: number | null;
  orderedStops: RoutePlanStop[];
  source: 'optimized' | 'fallback';
};

type OsrmWaypoint = {
  waypoint_index?: number;
  location?: [number, number];
};

type NominatimAddress = {
  postcode?: string;
  state?: string;
  state_district?: string;
  county?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  suburb?: string;
  province?: string;
  region?: string;
};

const MAP_ATTRIBUTION = '&copy; OpenStreetMap contributors';
const ETA_BUFFER_SECONDS = 60 * 60;
const FALLBACK_AVERAGE_SPEED_KMH = 55;

const formatDateTimeInputValue = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatDuration = (seconds?: number | null) => {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return 'unknown';
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
};

const estimateFallbackDurationSeconds = (distanceKm: number) => {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return null;
  return (distanceKm / FALLBACK_AVERAGE_SPEED_KMH) * 60 * 60;
};

// Computes cumulative ETA offsets for each stop using straight-line distance
// and FALLBACK_AVERAGE_SPEED_KMH when OSRM legs data is unavailable.
// points = [startPoint, stop0.point, stop1.point, ...] (N+1 entries for N stops)
// Returns an array of N offsets, one per stop, in the same order as points[1..N].
const computeFallbackEtaOffsets = (points: MapPoint[]): (number | null)[] => {
  if (points.length < 2) return [];
  const offsets: (number | null)[] = [];
  let cumulative = 0;
  for (let i = 1; i < points.length; i += 1) {
    const segmentKm = haversineDistanceKm(points[i - 1], points[i]);
    const segmentSeconds = segmentKm > 0
      ? (segmentKm / FALLBACK_AVERAGE_SPEED_KMH) * 3600
      : 0;
    cumulative += segmentSeconds;
    offsets.push(cumulative);
  }
  return offsets;
};

const createEndpoint = (): Endpoint => ({
  id: `ep-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  label: '',
  point: null,
  notes: '',
});

type MapClickHandlerProps = {
  onMapClick: (event: LeafletMouseEvent) => void;
};

const MapClickHandler = ({ onMapClick }: MapClickHandlerProps) => {
  useMapEvents({ click: onMapClick });
  return null;
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const haversineDistanceKm = (from: MapPoint, to: MapPoint) => {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const calculatePathDistanceKm = (points: MapPoint[]) => {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += haversineDistanceKm(points[i - 1], points[i]);
  }
  return total;
};

const squaredDistance = (a: MapPoint, b: MapPoint) => {
  const dLat = a.lat - b.lat;
  const dLng = a.lng - b.lng;
  return dLat * dLat + dLng * dLng;
};

const TripForm = ({ vehicles, drivers, dark = false, isSubmitting = false, onSubmit, onCancel }: TripFormProps) => {
  const { t } = useTranslation();
  const [values, setValues] = useState<TripFormValues>({
    vehicleId: '',
    userId: '',
    startLocation: '',
    endLocation: '',
    startTime: '',
    endTime: '',
    region: '',
    requiredCapacity: '',
    distance: '',
    revenue: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TripFormValues, string>>>({});
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>('start');
  const [mapCenter, setMapCenter] = useState<MapPoint>({ lat: 36.8065, lng: 10.1815 });
  const [startPoint, setStartPoint] = useState<MapPoint | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([createEndpoint()]);
  const [activeEndpointId, setActiveEndpointId] = useState<string | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [isOptimizingRoute, setIsOptimizingRoute] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(null);
  const [recommendations, setRecommendations] = useState<{ drivers: Driver[]; vehicles: Vehicle[] } | null>(null);
  const [isFetchingRecs, setIsFetchingRecs] = useState(false);
  const endpointLookupTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const startLookupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Immediate haversine estimate: departure → resolved stops → destination.
  // Shows a live distance preview before OSRM returns a road-accurate value.
  const autoDistance = useMemo(() => {
    const pts: MapPoint[] = [];
    if (startPoint) pts.push(startPoint);
    for (const ep of endpoints) {
      if (ep.point) pts.push(ep.point);
    }
    return calculatePathDistanceKm(pts);
  }, [startPoint, endpoints]);

  // Prefer the OSRM road distance stored in values.distance; fall back to
  // the haversine estimate while routing is still in flight.
  const displayDistance = values.distance || (autoDistance > 0 ? autoDistance.toFixed(1) : '');

  // Per-stop estimated arrival times, computed from routePlan.etaOffsetSeconds
  // and the user-entered startTime (Option A: driving time only, no buffer).
  // Indexed by endpointId for O(1) lookup in both the display layer and submit.
  const etaByEndpointId = useMemo<Record<string, string>>(() => {
    if (!routePlan || !values.startTime) return {};
    const startMs = new Date(values.startTime).getTime();
    if (Number.isNaN(startMs)) return {};

    const result: Record<string, string> = {};
    for (const stop of routePlan.orderedStops) {
      if (stop.etaOffsetSeconds === null) continue;
      result[stop.endpointId] = formatDateTimeInputValue(
        new Date(startMs + stop.etaOffsetSeconds * 1000)
      );
    }
    return result;
  }, [routePlan, values.startTime]);

  const sortedVehicles = useMemo(
    () => [...vehicles].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [vehicles]
  );

  const sortedDrivers = useMemo(
    () => [...drivers].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [drivers]
  );

  const selectedVehicle = useMemo(
    () => sortedVehicles.find((vehicle) => vehicle.id === values.vehicleId),
    [sortedVehicles, values.vehicleId]
  );

  const estimatedFuelLiters = useMemo(() => {
    const distance = Number(displayDistance);
    const consumption = Number(selectedVehicle?.consumption);
    if (!Number.isFinite(distance) || distance <= 0) return null;
    if (!Number.isFinite(consumption) || consumption <= 0) return null;
    return (distance * consumption) / 100;
  }, [displayDistance, selectedVehicle?.consumption]);

  const etaHelperText = useMemo(() => {
    if (!values.startTime) return t('trips.form.startTimeForEta');
    if (!routePlan?.durationSeconds) return t('trips.form.completeRouteForEta');
    return t('trips.form.etaHelper', { duration: formatDuration(routePlan.durationSeconds) });
  }, [routePlan?.durationSeconds, t, values.startTime]);

  const buildVehicleLabel = (vehicle: Vehicle) => (
    vehicle.plaque_immatriculation ? `${vehicle.name} (${vehicle.plaque_immatriculation})` : vehicle.name
  );

  const normalize = (value?: string | null) => String(value ?? '').trim().toLowerCase();

  const findVehicleFromAssignedValue = (assignedValue?: string | null) => {
    const normalizedAssigned = normalize(assignedValue);
    if (!normalizedAssigned) return undefined;
    return sortedVehicles.find((vehicle) => {
      return (
        normalizedAssigned === normalize(vehicle.id) ||
        normalizedAssigned === normalize(vehicle.plaque_immatriculation) ||
        normalizedAssigned === normalize(vehicle.name) ||
        normalizedAssigned === normalize(buildVehicleLabel(vehicle))
      );
    });
  };

  const findDriverAssignedToVehicle = (vehicleId: string) => {
    if (!vehicleId) return undefined;
    return sortedDrivers.find((driver) => findVehicleFromAssignedValue(driver.assignedVehicle)?.id === vehicleId);
  };

  const vehicleOptions = useMemo(() => {
    const base = [
      { value: '', label: t('common.selectVehicle') },
      ...sortedVehicles.map((vehicle) => {
        const rec = recommendations?.vehicles?.find((v) => v.id === vehicle.id);
        const score = (rec as any)?.ml_score;
        return {
          value: vehicle.id,
          label: buildVehicleLabel(vehicle) + (score ? t('common.scoreLabel', { score: Math.round(score) }) : ''),
        };
      }),
    ];
    if (recommendations?.vehicles?.length) {
      return base.sort((a, b) => {
        const scoreA = (recommendations.vehicles.find(v => v.id === a.value) as any)?.ml_score || 0;
        const scoreB = (recommendations.vehicles.find(v => v.id === b.value) as any)?.ml_score || 0;
        return scoreB - scoreA;
      });
    }
    return base;
  }, [recommendations, sortedVehicles, t]);

  const driverOptions = useMemo(() => {
    const base = [
      { value: '', label: t('common.selectDriver') },
      ...sortedDrivers.map((driver) => {
        const rec = recommendations?.drivers?.find((d) => d.id === driver.id);
        const score = (rec as any)?.ml_score;
        return {
          value: driver.id,
          label: driver.name + (score ? t('common.scoreLabel', { score: Math.round(score) }) : ''),
        };
      }),
    ];
    if (recommendations?.drivers?.length) {
      return base.sort((a, b) => {
        const scoreA = (recommendations.drivers.find(d => d.id === a.value) as any)?.ml_score || 0;
        const scoreB = (recommendations.drivers.find(d => d.id === b.value) as any)?.ml_score || 0;
        return scoreB - scoreA;
      });
    }
    return base;
  }, [recommendations, sortedDrivers, t]);

  const handleVehicleChange = (vehicleId: string) => {
    const autoDriverId = vehicleId ? findDriverAssignedToVehicle(vehicleId)?.id ?? '' : '';
    setValues((prev) => ({ ...prev, vehicleId, userId: autoDriverId || prev.userId }));
    setErrors((prev) => ({ ...prev, vehicleId: undefined, userId: autoDriverId ? undefined : prev.userId }));
  };

  const handleDriverChange = (userId: string) => {
    const selectedDriver = sortedDrivers.find((driver) => driver.id === userId);
    const autoVehicleId = findVehicleFromAssignedValue(selectedDriver?.assignedVehicle)?.id ?? '';
    setValues((prev) => ({ ...prev, userId, vehicleId: autoVehicleId || prev.vehicleId }));
    setErrors((prev) => ({ ...prev, userId: undefined, vehicleId: autoVehicleId ? undefined : prev.vehicleId }));
  };

  const onFieldChange = (field: keyof TripFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleGetRecommendations = async () => {
    if (!values.startTime || !values.startLocation) {
      setMapError(t('trips.form.recMapErrorStartLocation'));
      return;
    }
    try {
      setIsFetchingRecs(true);
      setMapError(null);
      const recs = await tripsService.getTripRecommendations({
        startTime: new Date(values.startTime).toISOString(),
        endTime: values.endTime ? new Date(values.endTime).toISOString() : undefined,
        region: values.region || values.startLocation.split(',')[0],
        distance: Number(displayDistance) || 0,
        requiredCapacity: Number(values.requiredCapacity) || 0,
      });
      setRecommendations(recs);
      setValues(prev => ({
        ...prev,
        vehicleId: prev.vehicleId || recs.vehicles[0]?.id || '',
        userId: prev.userId || recs.drivers[0]?.id || '',
      }));
    } catch {
      setMapError(t('trips.form.recFetchError'));
    } finally {
      setIsFetchingRecs(false);
    }
  };

  const addEndpoint = () => {
    setEndpoints((prev) => [...prev, createEndpoint()]);
  };

  const removeEndpoint = (endpointId: string) => {
    setEndpoints((prev) => {
      const next = prev.filter((ep) => ep.id !== endpointId);
      return next.length > 0 ? next : [createEndpoint()];
    });
    if (activeEndpointId === endpointId) {
      setActiveEndpointId(null);
      setPickerTarget('start');
    }
  };

  const beginEndpointPick = (endpointId: string) => {
    setActiveEndpointId(endpointId);
    setPickerTarget('end');
  };

  const resolveAddress = async (point: MapPoint) => {
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: String(point.lat),
      lon: String(point.lng),
      'accept-language': 'en',
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`);
    if (!response.ok) throw new Error(t('trips.form.tech.resolveFromMapFail'));
    const data = (await response.json()) as { display_name?: string; address?: NominatimAddress; error?: string };
    if (data.error || !data.display_name) throw new Error(data.error || t('trips.form.tech.noAddressForPoint'));
    return formatLocationFromAddress(data.display_name, data.address);
  };

  const resolvePointFromAddress = async (addressQuery: string): Promise<MapPoint | null> => {
    const query = addressQuery.trim();
    if (query.length < 2) return null;
    const params = new URLSearchParams({ format: 'jsonv2', q: query, limit: '1', 'accept-language': 'en' });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
    if (!response.ok) throw new Error(t('trips.form.tech.stopNotOnMap'));
    const data = (await response.json()) as Array<{ lat?: string; lon?: string }>;
    if (!Array.isArray(data) || data.length === 0) return null;
    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  };

  const handleEndpointLabelChange = (endpointId: string, label: string) => {
    setMapError(null);
    setEndpoints((prev) =>
      prev.map((ep) =>
        ep.id === endpointId
          ? { ...ep, label, point: label.trim().length >= 2 ? ep.point : null }
          : ep
      )
    );

    const existingTimeout = endpointLookupTimeoutsRef.current[endpointId];
    if (existingTimeout) clearTimeout(existingTimeout);
    if (label.trim().length < 2) return;

    endpointLookupTimeoutsRef.current[endpointId] = setTimeout(async () => {
      try {
        setIsResolvingLocation(true);
        const point = await resolvePointFromAddress(label);
        if (!point) {
          setMapError(t('trips.form.tech.couldNotLocateOnMap', { label }));
          setEndpoints((prev) => prev.map((ep) => (ep.id === endpointId ? { ...ep, point: null } : ep)));
          return;
        }
        setMapCenter(point);
        setEndpoints((prev) => prev.map((ep) => (ep.id === endpointId ? { ...ep, point } : ep)));
        setErrors((prev) => ({ ...prev, endLocation: undefined }));
      } catch (error) {
        setMapError(error instanceof Error ? error.message : t('trips.form.tech.couldNotLocateStop'));
        setEndpoints((prev) => prev.map((ep) => (ep.id === endpointId ? { ...ep, point: null } : ep)));
      } finally {
        setIsResolvingLocation(false);
      }
    }, 550);
  };

  const handleEndpointNotesChange = (endpointId: string, notes: string) => {
    setEndpoints((prev) => prev.map((ep) => (ep.id === endpointId ? { ...ep, notes } : ep)));
  };

  const handleStartLocationChange = (label: string) => {
    onFieldChange('startLocation', label);
    setMapError(null);
    if (startLookupTimeoutRef.current) clearTimeout(startLookupTimeoutRef.current);
    if (label.trim().length < 2) { setStartPoint(null); return; }

    startLookupTimeoutRef.current = setTimeout(async () => {
      try {
        setIsResolvingLocation(true);
        const point = await resolvePointFromAddress(label);
        if (!point) {
          setMapError(t('trips.form.tech.couldNotLocateOnMap', { label }));
          setStartPoint(null);
          return;
        }
        setStartPoint(point);
        setMapCenter(point);
        setErrors((prev) => ({ ...prev, startLocation: undefined }));
      } catch (error) {
        setMapError(error instanceof Error ? error.message : t('trips.form.tech.couldNotResolvePoint'));
        setStartPoint(null);
      } finally {
        setIsResolvingLocation(false);
      }
    }, 550);
  };

  const handleMapClick = async (event: LeafletMouseEvent) => {
    const point: MapPoint = { lat: event.latlng.lat, lng: event.latlng.lng };
    setMapCenter(point);
    setMapError(null);

    if (pickerTarget === 'start') {
      setStartPoint(point);
      try {
        setIsResolvingLocation(true);
        const address = await resolveAddress(point);
        if (!address) return;
        onFieldChange('startLocation', address);
        setErrors((prev) => ({ ...prev, startLocation: undefined }));
      } catch (error) {
        setMapError(error instanceof Error ? error.message : t('trips.form.tech.couldNotResolvePoint'));
      } finally {
        setIsResolvingLocation(false);
      }
      return;
    }

    if (!activeEndpointId) { setMapError(t('trips.form.tech.chooseEndpointFirst')); return; }

    try {
      setIsResolvingLocation(true);
      const address = await resolveAddress(point);
      if (!address) return;
      setEndpoints((prev) =>
        prev.map((ep) => ep.id === activeEndpointId ? { ...ep, label: address, point } : ep)
      );
      setErrors((prev) => ({ ...prev, endLocation: undefined }));
    } catch (error) {
      setMapError(error instanceof Error ? error.message : t('trips.form.tech.couldNotResolvePoint'));
    } finally {
      setIsResolvingLocation(false);
    }
  };

  // ── Route optimisation effect ─────────────────────────────────────────────
  // deps: [startPoint, endpoints]
  // IMPORTANT: never write to `endpoints` state inside this effect — doing so
  // would create a circular dependency since `endpoints` is a dep of the effect.
  // ETA data is stored exclusively in routePlan.orderedStops[].etaOffsetSeconds
  // and projected into display strings by the `etaByEndpointId` useMemo below.
  useEffect(() => {
    const readyEndpoints = endpoints.filter(
      (ep) => ep.point && ep.label.trim().length > 0
    ) as Array<Endpoint & { point: MapPoint }>;

    if (!startPoint || readyEndpoints.length === 0 || readyEndpoints.length !== endpoints.length) {
      setRoutePlan(null);
      setValues((prev) => ({ ...prev, endLocation: '', distance: '', endTime: '' }));
      return;
    }

    let cancelled = false;

    const optimizeRoute = async () => {
      try {
        setIsOptimizingRoute(true);
        setMapError(null);

        const coordinates = [startPoint, ...readyEndpoints.map((ep) => ep.point)];
        const coordinateString = coordinates.map((p) => `${p.lng},${p.lat}`).join(';');
        const params = new URLSearchParams({
          source: 'first',
          roundtrip: 'false',
          steps: 'false',
          overview: 'false',
          geometries: 'geojson',
        });

        const response = await fetch(
          `https://router.project-osrm.org/trip/v1/driving/${coordinateString}?${params.toString()}`
        );
        if (!response.ok) throw new Error(t('trips.form.tech.optimizeRouteFail'));

        const data = (await response.json()) as {
          code?: string;
          message?: string;
          trips?: Array<{
            distance: number;
            duration?: number;
            // legs[j] = segment from waypoint j to waypoint j+1 in optimized order
            legs?: Array<{ duration?: number }>;
          }>;
          waypoints?: OsrmWaypoint[];
        };

        if (data.code !== 'Ok' || !data.trips?.length || !data.waypoints?.length) {
          throw new Error(data.message || t('trips.form.tech.couldNotComputeRoute'));
        }

        // ── Map OSRM waypoints back to our endpoint objects ───────────────
        const remainingEndpoints = [...readyEndpoints];

        const matched = data.waypoints
          .map((waypoint, inputIndex) => {
            const waypointIndex = typeof waypoint.waypoint_index === 'number' ? waypoint.waypoint_index : inputIndex;
            // waypoint_index 0 = start (source=first) — skip it
            if (waypointIndex < 1) return null;

            const waypointLocation = waypoint.location;
            let matchedIdx = -1;

            if (
              Array.isArray(waypointLocation) &&
              waypointLocation.length === 2 &&
              Number.isFinite(waypointLocation[0]) &&
              Number.isFinite(waypointLocation[1])
            ) {
              const waypointPoint: MapPoint = { lat: waypointLocation[1], lng: waypointLocation[0] };
              let best = Number.POSITIVE_INFINITY;
              for (let i = 0; i < remainingEndpoints.length; i += 1) {
                const d = squaredDistance(waypointPoint, remainingEndpoints[i].point);
                if (d < best) { best = d; matchedIdx = i; }
              }
            }

            if (matchedIdx < 0) {
              // Fallback: use input position (minus the start waypoint)
              matchedIdx = Math.max(0, Math.min(inputIndex - 1, remainingEndpoints.length - 1));
            }
            if (matchedIdx < 0 || matchedIdx >= remainingEndpoints.length) return null;

            const [ep] = remainingEndpoints.splice(matchedIdx, 1);
            return { waypointIndex, endpointId: ep.id, label: ep.label, point: ep.point };
          })
          .filter((e): e is { waypointIndex: number; endpointId: string; label: string; point: MapPoint } => Boolean(e))
          .sort((a, b) => a.waypointIndex - b.waypointIndex);

        if (matched.length !== readyEndpoints.length) {
          throw new Error(t('trips.form.tech.couldNotResolveOrder'));
        }

        // ── Compute cumulative ETA offsets from OSRM legs ─────────────────
        // legs[j] = segment from the j-th waypoint to the (j+1)-th in optimized order.
        // orderedStops[j] is reached after legs[0..j] (inclusive), i.e. j+1 legs.
        // Guard: if legs is absent or its count ≠ number of stops, fall back to null.
        const legs = data.trips[0].legs;
        const legsOk = Array.isArray(legs) && legs.length === matched.length;

        const orderedStops: RoutePlanStop[] = matched.map(({ endpointId, label, point }, j) => {
          let etaOffsetSeconds: number | null = null;
          if (legsOk) {
            let cumulative = 0;
            for (let k = 0; k <= j; k += 1) {
              const legDuration = legs![k].duration;
              if (typeof legDuration !== 'number' || !Number.isFinite(legDuration)) {
                cumulative = NaN;
                break;
              }
              cumulative += legDuration;
            }
            etaOffsetSeconds = Number.isFinite(cumulative) ? cumulative : null;
          }
          return { endpointId, label, point, etaOffsetSeconds };
        });

        const distanceKm = data.trips[0].distance / 1000;
        const durationSeconds = Number.isFinite(data.trips[0].duration) ? Number(data.trips[0].duration) : null;

        if (cancelled) return;

        setRoutePlan({ distanceKm, durationSeconds, orderedStops, source: 'optimized' });
        setValues((prev) => ({
          ...prev,
          endLocation: orderedStops[orderedStops.length - 1]?.label || '',
          distance: distanceKm.toFixed(1),
        }));
        setErrors((prev) => ({ ...prev, endLocation: undefined, distance: undefined }));
      } catch {
        if (cancelled) return;

        // ── Fallback: keep original input order, haversine distances ──────
        const fallbackStops = readyEndpoints.map((ep) => ({
          endpointId: ep.id,
          label: ep.label,
          point: ep.point,
        }));

        // Compute per-segment ETA offsets using haversine + average speed
        const routePoints: MapPoint[] = [startPoint, ...fallbackStops.map((s) => s.point)];
        const etaOffsets = computeFallbackEtaOffsets(routePoints);

        const fallbackDistance = calculatePathDistanceKm(routePoints);
        const orderedStops: RoutePlanStop[] = fallbackStops.map((s, j) => ({
          ...s,
          etaOffsetSeconds: etaOffsets[j] ?? null,
        }));

        setRoutePlan({
          distanceKm: fallbackDistance,
          durationSeconds: estimateFallbackDurationSeconds(fallbackDistance),
          orderedStops,
          source: 'fallback',
        });
        setValues((prev) => ({
          ...prev,
          endLocation: fallbackStops[fallbackStops.length - 1]?.label || '',
          distance: fallbackDistance > 0 ? fallbackDistance.toFixed(1) : '',
        }));
        setErrors((prev) => ({ ...prev, endLocation: undefined, distance: undefined }));
        setMapError(t('trips.form.tech.routingFallback'));
      } finally {
        if (!cancelled) setIsOptimizingRoute(false);
      }
    };

    optimizeRoute();
    return () => { cancelled = true; };
  }, [startPoint, endpoints]);

  useEffect(() => {
    return () => {
      Object.values(endpointLookupTimeoutsRef.current).forEach(clearTimeout);
      if (startLookupTimeoutRef.current) clearTimeout(startLookupTimeoutRef.current);
    };
  }, []);

  // Keep the trip-level ETA (endTime) in sync: driving time + 1h buffer (Option A)
  useEffect(() => {
    if (!values.startTime || !routePlan?.durationSeconds) {
      setValues((prev) => (prev.endTime ? { ...prev, endTime: '' } : prev));
      return;
    }
    const startDate = new Date(values.startTime);
    if (Number.isNaN(startDate.getTime())) {
      setValues((prev) => (prev.endTime ? { ...prev, endTime: '' } : prev));
      return;
    }
    const etaDate = new Date(startDate.getTime() + (routePlan.durationSeconds + ETA_BUFFER_SECONDS) * 1000);
    const nextEndTime = formatDateTimeInputValue(etaDate);
    setValues((prev) => (prev.endTime === nextEndTime ? prev : { ...prev, endTime: nextEndTime }));
    setErrors((prev) => ({ ...prev, endTime: undefined }));
  }, [routePlan?.durationSeconds, values.startTime]);

  const validate = () => {
    const nextErrors: Partial<Record<keyof TripFormValues, string>> = {};

    if (!values.vehicleId) nextErrors.vehicleId = t('trips.form.errors.vehicleRequired');
    if (!values.userId) nextErrors.userId = t('trips.form.errors.driverRequired');
    if (values.startLocation.trim().length < 2) nextErrors.startLocation = t('trips.form.errors.startRequired');
    if (values.endLocation.trim().length < 2) nextErrors.endLocation = t('trips.form.errors.destinationRequired');
    if (!values.startTime) nextErrors.startTime = t('trips.form.errors.startTimeRequired');
    if (!values.endTime) nextErrors.endTime = t('trips.form.errors.etaRequired');
    if (!values.region) nextErrors.region = t('trips.form.errors.regionRequired');
    if (!values.requiredCapacity || Number(values.requiredCapacity) <= 0) {
      nextErrors.requiredCapacity = t('trips.form.errors.capacityPositive');
    }
    if (values.startTime && values.endTime) {
      const s = new Date(values.startTime);
      const e = new Date(values.endTime);
      if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e <= s) {
        nextErrors.endTime = t('trips.form.errors.etaAfterStart');
      }
    }
    const distanceValue = Number(displayDistance);
    if (!displayDistance || Number.isNaN(distanceValue) || distanceValue <= 0) {
      nextErrors.distance = t('trips.form.errors.distancePositive');
    }
    if (values.revenue.trim().length > 0) {
      const revenueValue = Number(values.revenue);
      if (Number.isNaN(revenueValue) || revenueValue < 0) {
        nextErrors.revenue = t('trips.form.errors.revenueInvalid');
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const orderedRouteStops = routePlan?.orderedStops ?? [];
    const intermediateStops = orderedRouteStops.slice(0, -1);
    const finalDestination = orderedRouteStops[orderedRouteStops.length - 1] ?? null;

    // Build a lookup by endpointId so we can join notes (from endpoints state)
    // with ETA times (from etaByEndpointId) onto each stop in submission order.
    const endpointById = Object.fromEntries(endpoints.map((ep) => [ep.id, ep]));

    await onSubmit({
      vehicleId: values.vehicleId,
      userId: values.userId,
      startLocation: values.startLocation.trim(),
      startLatitude: startPoint?.lat,
      startLongitude: startPoint?.lng,
      endLocation: values.endLocation.trim(),
      endLatitude: finalDestination?.point.lat,
      endLongitude: finalDestination?.point.lng,
      startTime: new Date(values.startTime).toISOString(),
      endTime: new Date(values.endTime).toISOString(),
      region: values.region.trim(),
      distance: Number(displayDistance),
      fuel: estimatedFuelLiters !== null ? Number(estimatedFuelLiters.toFixed(2)) : undefined,
      revenue: values.revenue.trim().length > 0 ? Number(values.revenue) : undefined,
      requiredCapacity: Number(values.requiredCapacity),
      stops: intermediateStops.map((stop, index) => {
        const localEta = etaByEndpointId[stop.endpointId];
        return {
          locationName: stop.label,
          stopOrder: index + 1,
          latitude: stop.point.lat,
          longitude: stop.point.lng,
          notes: endpointById[stop.endpointId]?.notes.trim() || undefined,
          // Convert local datetime string to ISO-8601, consistent with startTime/endTime
          estimatedArrival: localEta ? new Date(localEta).toISOString() : undefined,
        };
      }),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ── 1. Locations ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('trips.form.startLocation')}
          value={values.startLocation}
          onChange={(e) => handleStartLocationChange(e.target.value)}
          error={errors.startLocation}
          placeholder={t('trips.form.startPlaceholder')}
        />
        <Input
          label={t('trips.form.finalDestination')}
          value={values.endLocation}
          onChange={(e) => onFieldChange('endLocation', e.target.value)}
          error={errors.endLocation}
          placeholder={t('trips.form.endPlaceholder')}
        />
      </div>

      {/* ── 2. Route parameters ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          label={t('trips.form.startDateTime')}
          type="datetime-local"
          value={values.startTime}
          onChange={(e) => onFieldChange('startTime', e.target.value)}
          error={errors.startTime}
        />
        <Input
          label={t('trips.form.etaLabel')}
          type="datetime-local"
          value={values.endTime}
          readOnly
          error={errors.endTime}
          helperText={etaHelperText}
          placeholder={t('trips.form.etaPlaceholder')}
          className="cursor-not-allowed"
        />
        <Input
          label={t('common.region')}
          value={values.region}
          onChange={(e) => onFieldChange('region', e.target.value)}
          error={errors.region}
          placeholder={t('trips.form.regionPlaceholder')}
        />
        <Input
          label={t('trips.form.reqCapacity')}
          type="number"
          min="1"
          value={values.requiredCapacity}
          onChange={(e) => onFieldChange('requiredCapacity', e.target.value)}
          error={errors.requiredCapacity}
          placeholder={t('trips.form.minCapacityPh')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('trips.form.distanceKm')}
          type="number"
          min="1"
          step="0.1"
          value={displayDistance}
          error={errors.distance}
          placeholder={t('trips.form.distanceAutoPh')}
          readOnly
        />
        <Input
          label={t('trips.form.revenueTnd')}
          type="number"
          min="0"
          step="0.1"
          value={values.revenue}
          onChange={(e) => onFieldChange('revenue', e.target.value)}
          error={errors.revenue}
          placeholder={t('common.optional')}
        />
      </div>

      {/* ── 3. Stops / endpoints ──────────────────────────────────── */}
      <div className={`rounded-2xl border p-4 space-y-3 ${dark ? 'border-slate-700/80 bg-slate-900/30' : 'border-slate-200/90 bg-white/70'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`text-sm font-semibold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{t('trips.form.endpointsTitle')}</p>
            <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t('trips.form.endpointsHint')}</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={addEndpoint}
            disabled={isResolvingLocation || isOptimizingRoute}
          >
            {t('trips.form.addStop')}
          </Button>
        </div>

        <div className="space-y-3">
          {endpoints.map((endpoint, index) => {
            // Read-only ETA derived from routePlan + startTime (Option A: no buffer)
            const stopEta = etaByEndpointId[endpoint.id] ?? '';
            const stopEtaHelper = values.startTime
              ? (stopEta ? '' : t('trips.form.completeRouteForEta'))
              : t('trips.form.startTimeForEta');

            return (
              <div
                key={endpoint.id}
                className={`rounded-xl border p-3 space-y-2 ${dark ? 'border-slate-700/80 bg-slate-800/40' : 'border-slate-200 bg-slate-50/70'}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center shrink-0 ${dark ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-700'}`}>
                    {index + 1}
                  </div>
                  <Input
                    value={endpoint.label}
                    onChange={(e) => handleEndpointLabelChange(endpoint.id, e.target.value)}
                    placeholder={t('trips.form.stopPlaceholder')}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant={activeEndpointId === endpoint.id && pickerTarget === 'end' ? 'primary' : 'secondary'}
                    onClick={() => beginEndpointPick(endpoint.id)}
                    disabled={isResolvingLocation || isOptimizingRoute}
                  >
                    {t('common.set')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => removeEndpoint(endpoint.id)}
                    disabled={endpoints.length === 1 || isResolvingLocation || isOptimizingRoute}
                  >
                    {t('common.remove')}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                  {/* Estimated arrival is read-only: computed from OSRM legs (or
                      haversine fallback) stored in routePlan. Not editable to avoid
                      circular dependency with the optimizeRoute effect. */}
                  <Input
                    label={t('trips.form.stopEstimatedArrival')}
                    type="datetime-local"
                    value={stopEta}
                    readOnly
                    helperText={stopEtaHelper}
                    className="cursor-not-allowed"
                  />
                  <div>
                    <label className={`block text-[12px] font-medium mb-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t('trips.form.stopNotes')}
                    </label>
                    <textarea
                      value={endpoint.notes}
                      onChange={(e) => handleEndpointNotesChange(endpoint.id, e.target.value)}
                      rows={2}
                      placeholder={t('common.optional')}
                      className={`w-full px-3 py-2 border text-sm rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none ${
                        dark
                          ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 hover:border-slate-600'
                          : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 hover:border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. Map ────────────────────────────────────────────────── */}
      <div className={`rounded-2xl border p-4 space-y-3 ${dark ? 'border-slate-700/80 bg-slate-900/30' : 'border-slate-200/90 bg-white/70'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className={`text-sm font-semibold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{t('trips.form.mapSectionTitle')}</p>
            <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t('trips.form.mapSectionHint')}</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant={pickerTarget === 'start' ? 'primary' : 'secondary'}
            onClick={() => { setPickerTarget('start'); setActiveEndpointId(null); }}
            disabled={isResolvingLocation}
          >
            {t('trips.form.setStart')}
          </Button>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-slate-200/70 dark:border-slate-700/70">
          <MapContainer center={mapCenter} zoom={9} style={{ width: '100%', height: '280px' }} className="z-0">
            <TileLayer attribution={MAP_ATTRIBUTION} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapClickHandler onMapClick={handleMapClick} />
            {startPoint && (
              <CircleMarker center={startPoint} radius={8} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.85 }} />
            )}
            {endpoints.map((ep, index) =>
              ep.point && (
                <CircleMarker
                  key={ep.id}
                  center={ep.point}
                  radius={7}
                  pathOptions={{
                    color: activeEndpointId === ep.id ? '#0ea5e9' : '#ef4444',
                    fillColor: activeEndpointId === ep.id ? '#0ea5e9' : '#ef4444',
                    fillOpacity: 0.85,
                  }}
                >
                  <title>{t('common.endpointTitle', { n: index + 1 })}</title>
                </CircleMarker>
              )
            )}
          </MapContainer>
        </div>

        {routePlan && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${
            routePlan.source === 'optimized'
              ? dark ? 'border-emerald-900/40 bg-emerald-950/20 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : dark ? 'border-amber-900/40 bg-amber-950/20 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}>
            {routePlan.source === 'optimized' ? t('trips.form.optimizedOrder') : t('trips.form.fallbackOrder')}:{' '}
            {routePlan.orderedStops.map((s, i) => `${i + 1}. ${s.label}`).join(t('common.rangeArrow'))}
            {routePlan.orderedStops.length > 0 && (
              <span>{` ${t('trips.form.finalDestInline', { label: routePlan.orderedStops[routePlan.orderedStops.length - 1]?.label })}`}</span>
            )}
            {routePlan.durationSeconds && (
              <span>{` ${t('trips.form.etaHelper', { duration: formatDuration(routePlan.durationSeconds) })}`}</span>
            )}
          </div>
        )}

        {(isResolvingLocation || isOptimizingRoute || mapError) && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${
            mapError
              ? (dark ? 'border-red-900/50 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-700')
              : (dark ? 'border-slate-700 bg-slate-800/70 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700')
          }`}>
            {mapError || (isOptimizingRoute ? t('trips.form.optimizing') : t('trips.form.resolving'))}
          </div>
        )}
      </div>

      {/* ── 5. Fuel estimate ──────────────────────────────────────── */}
      <div className={`rounded-xl border px-4 py-3 text-sm ${dark ? 'border-slate-700 bg-slate-800/60 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
        {`${t('trips.form.estimatedFuel')}: `}
        {estimatedFuelLiters !== null
          ? t('trips.form.estimatedFuelFromConsumption', { fuel: estimatedFuelLiters.toFixed(1), consumption: selectedVehicle?.consumption ?? '' })
          : t('trips.form.estimatedFuelHint')}
      </div>

      {/* ── 6. Vehicle & Driver ───────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
            {t('trips.form.vehicleLabel')} &amp; {t('trips.form.driverLabel')}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleGetRecommendations}
            isLoading={isFetchingRecs}
            disabled={!values.startTime || isFetchingRecs}
            className="gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-500/40 dark:hover:bg-indigo-500/10 whitespace-nowrap text-xs"
          >
            <FiZap className="w-3.5 h-3.5 shrink-0" />
            {recommendations ? t('trips.form.refreshSuggestions') : t('trips.form.optimizeTrip')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">{t('trips.form.vehicleLabel')}</label>
            <Select value={values.vehicleId} onChange={handleVehicleChange} dark={dark} options={vehicleOptions} className={errors.vehicleId ? '[&>button]:!border-red-500' : ''} />
            {errors.vehicleId && <p className="mt-1 text-sm text-red-600">{errors.vehicleId}</p>}
          </div>
          <div>
            <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">{t('trips.form.driverLabel')}</label>
            <Select value={values.userId} onChange={handleDriverChange} dark={dark} options={driverOptions} className={errors.userId ? '[&>button]:!border-red-500' : ''} />
            {errors.userId && <p className="mt-1 text-sm text-red-600">{errors.userId}</p>}
          </div>
        </div>
      </div>

      {/* ── 7. Action buttons ─────────────────────────────────────── */}
      <div className="sticky bottom-0 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 px-4 sm:px-5 py-4 mt-4 bg-white dark:bg-[#0b1628] border-t border-slate-100 dark:border-cyan-100/10 shadow-[0_-4px_12px_-6px_rgba(0,0,0,0.08)] flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto justify-center">
          {t('common.cancel')}
        </Button>
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto justify-center">
          {t('trips.form.createTrip')}
        </Button>
      </div>
    </form>
  );
};

export default TripForm;
