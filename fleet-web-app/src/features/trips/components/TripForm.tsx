import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import type { LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button, Input, Select } from '../../../shared/components';
import type { Driver, Vehicle } from '../../../types';
import { tripsService, type RankedRecommendationItem } from '../services/trips.service';

import { formatLocationFromAddress } from '../utils/locationLabel';

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
  notes: string;
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
    loadType?: 'general' | 'cold' | 'fragile' | 'heavy';
    distance: number;
    distance_in_meters?: number;
    estimated_duration_seconds?: number;
    fuel?: number;
    revenue?: number;
    notes?: string;
    stops?: Array<{
      locationName: string;
      stopOrder: number;
      latitude?: number;
      longitude?: number;
    }>;
  }) => Promise<void> | void;
  onCancel: () => void;
}

type MapPoint = {
  lat: number;
  lng: number;
};

type PickerTarget = 'start' | 'end';

type Endpoint = {
  id: string;
  label: string;
  point: MapPoint | null;
};

type RoutePlanStop = {
  endpointId: string;
  label: string;
  point: MapPoint;
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

type OrsDirectionsResponse = {
  routes?: Array<{
    summary?: {
      distance?: number;
      duration?: number;
    };
  }>;
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
const ORS_API_KEY = String(import.meta.env.VITE_ORS_API_KEY || '').trim();
const ORS_DIRECTIONS_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';
const ORS_GEOCODE_URL = 'https://api.openrouteservice.org/geocode/search';

const getOrsErrorMessage = async (response: Response) => {
  try {
    const data = await response.json();
    const detail = data?.error?.message || data?.message || data?.error;
      return detail ? String(detail) : null;
  } catch {
    return null;
  }
};

const fetchOrsPointFromAddress = async (query: string): Promise<MapPoint | null> => {
  if (!ORS_API_KEY) return null;

  const params = new URLSearchParams({ text: query, size: '1' });
  const response = await fetch(`${ORS_GEOCODE_URL}?${params.toString()}`, {
    headers: {
      Accept: 'application/json, application/geo+json',
      Authorization: ORS_API_KEY,
    },
  });

  if (!response.ok) {
    const detail = await getOrsErrorMessage(response);
    throw new Error(detail || 'OpenRouteService geocoding failed.');
  }

  const data = (await response.json()) as {
    features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
  };

  const coords = data?.features?.[0]?.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;

  const [lng, lat] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
};

const fetchNominatimPointFromAddress = async (query: string): Promise<MapPoint | null> => {
  const params = new URLSearchParams({
    format: 'jsonv2',
    q: query,
    limit: '1',
    'accept-language': 'en',
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to find this stop on map.');
  }

  const data = (await response.json()) as Array<{ lat?: string; lon?: string }>;
  if (!Array.isArray(data) || data.length === 0) return null;

  const lat = Number(data[0].lat);
  const lng = Number(data[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
};

const createEndpoint = (): Endpoint => ({
  id: `ep-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  label: '',
  point: null,
});

type MapClickHandlerProps = {
  onMapClick: (event: LeafletMouseEvent) => void;
};

const MapClickHandler = ({ onMapClick }: MapClickHandlerProps) => {
  useMapEvents({
    click: onMapClick,
  });
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

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.round((safeSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
};

const estimateFallbackDurationSeconds = (distanceKm: number) => {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return null;
  const averageSpeedKmh = 45;
  return Math.round((distanceKm / averageSpeedKmh) * 3600);
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
    notes: '',
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
  const [recommendations, setRecommendations] = useState<{
    drivers: RankedRecommendationItem[];
    vehicles: RankedRecommendationItem[];
  } | null>(null);
  const [isFetchingRecs, setIsFetchingRecs] = useState(false);
  const endpointLookupTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const geocodeCacheRef = useRef<Map<string, MapPoint>>(new Map());
  const directionsCacheRef = useRef<Map<string, { distanceMeters: number; durationSeconds: number }>>(new Map());
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [estimatedDurationSeconds, setEstimatedDurationSeconds] = useState<number | null>(null);


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
    const distance = Number(values.distance);
    const consumption = Number(selectedVehicle?.consumption);

    if (!Number.isFinite(distance) || distance <= 0) return null;
    if (!Number.isFinite(consumption) || consumption <= 0) return null;

    return (distance * consumption) / 100;
  }, [values.distance, selectedVehicle?.consumption]);

  const etaHelperText = useMemo(() => {
    if (!values.startTime) return 'Set a start time to calculate ETA.';
    if (!routePlan?.durationSeconds) return 'Complete the route points to calculate ETA from the map.';

    return `Map route time ${formatDuration(routePlan.durationSeconds)} + 1h spare time.`;
  }, [routePlan?.durationSeconds, values.startTime]);

  const buildVehicleLabel = (vehicle: Vehicle) => (
    vehicle.plaque_immatriculation ? `${vehicle.name} (${vehicle.plaque_immatriculation})` : vehicle.name
  );

  const normalize = (value?: string | null) => String(value ?? '').trim().toLowerCase();

  const findVehicleFromAssignedValue = (assignedValue?: string | null) => {
    const normalizedAssigned = normalize(assignedValue);
    if (!normalizedAssigned) return undefined;

    return sortedVehicles.find((vehicle) => {
      const normalizedId = normalize(vehicle.id);
      const normalizedName = normalize(vehicle.name);
      const normalizedPlate = normalize(vehicle.plaque_immatriculation);
      const normalizedLabel = normalize(buildVehicleLabel(vehicle));

      return (
        normalizedAssigned === normalizedId ||
        normalizedAssigned === normalizedPlate ||
        normalizedAssigned === normalizedName ||
        normalizedAssigned === normalizedLabel
      );
    });
  };

  const findDriverAssignedToVehicle = (vehicleId: string) => {
    if (!vehicleId) return undefined;
    return sortedDrivers.find((driver) => findVehicleFromAssignedValue(driver.assignedVehicle)?.id === vehicleId);
  };

  const vehicleOptions = useMemo(() => {
    if (recommendations?.vehicles?.length) {
      const rankedVehicles = [...recommendations.vehicles].sort((a, b) => {
        const scoreA = a.score || 0;
        const scoreB = b.score || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return (a.name || '').localeCompare(b.name || '');
      });

      return [
        { value: '', label: t('trips.form.selectVehicle') },
        ...rankedVehicles.map((vehicle) => {
          const score = vehicle.score;
          return {
            value: vehicle.id,
            label:
              (vehicle.name || t('common.vehicleDefaultName')) +
              (score ? t('common.scoreLabel', { score: Math.round(score) }) : ''),
          };
        }),
      ];
    }

    return [
      { value: '', label: t('trips.form.selectVehicle') },
      ...sortedVehicles.map((vehicle) => ({
        value: vehicle.id,
        label: buildVehicleLabel(vehicle),
      })),
    ];
  }, [sortedVehicles, recommendations, t]);

  const driverOptions = useMemo(() => {
    if (recommendations?.drivers?.length) {
      const rankedDrivers = [...recommendations.drivers].sort((a, b) => {
        const scoreA = a.score || 0;
        const scoreB = b.score || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return (a.name || '').localeCompare(b.name || '');
      });

      return [
        { value: '', label: t('trips.form.selectDriver') },
        ...rankedDrivers.map((driver) => {
          const score = driver.score;
          return {
            value: driver.id,
            label: driver.name + (score ? t('common.scoreLabel', { score: Math.round(score) }) : ''),
          };
        }),
      ];
    }

    return [
      { value: '', label: t('trips.form.selectDriver') },
      ...sortedDrivers.map((driver) => ({
        value: driver.id,
        label: driver.name,
      })),
    ];
  }, [sortedDrivers, recommendations, t]);

  const handleVehicleChange = (vehicleId: string) => {
    const autoDriverId = vehicleId ? findDriverAssignedToVehicle(vehicleId)?.id ?? '' : '';

    setValues((prev) => ({
      ...prev,
      vehicleId,
      userId: autoDriverId || prev.userId,
    }));

    setErrors((prev) => ({
      ...prev,
      vehicleId: undefined,
      userId: autoDriverId ? undefined : prev.userId,
    }));
  };

  const handleDriverChange = (userId: string) => {
    const selectedDriver = sortedDrivers.find((driver) => driver.id === userId);
    const assignedVehicle = findVehicleFromAssignedValue(selectedDriver?.assignedVehicle);
    const autoVehicleId = assignedVehicle?.id ?? '';

    setValues((prev) => ({
      ...prev,
      userId,
      vehicleId: autoVehicleId || prev.vehicleId,
    }));

    setErrors((prev) => ({
      ...prev,
      userId: undefined,
      vehicleId: autoVehicleId ? undefined : prev.vehicleId,
    }));
  };

  const onFieldChange = (field: keyof TripFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleGetRecommendations = async () => {
    if (!values.startLocation) {
      setMapError(t('trips.form.recMapErrorStart'));
      return;
    }

    if (!values.startTime) {
      setMapError(t('trips.form.recMapErrorTime'));
      return;
    }

    const distanceValueKm = Number(values.distance);
    if (!Number.isFinite(distanceValueKm) || distanceValueKm <= 0) {
      setMapError(t('trips.form.recMapErrorDistance'));
      return;
    }

    const startTimeIso = new Date(values.startTime).toISOString();

    try {
      setIsFetchingRecs(true);
      setMapError(null);
      
      const recs = await tripsService.getTripRecommendations({
        action: 'assignment',
        startTime: startTimeIso,
        endTime: values.endTime ? new Date(values.endTime).toISOString() : undefined,
        region: values.region || values.startLocation.split(',')[0],
        distance: distanceValueKm,
        requiredCapacity: Number(values.requiredCapacity) || 0,
        loadType: 'general',
      });

      setRecommendations(recs);


      // Auto-select the best ones if none are selected
      setValues(prev => ({
        ...prev,
        vehicleId: prev.vehicleId || recs.vehicles[0]?.id || '',
        userId: prev.userId || recs.drivers[0]?.id || ''
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
      const next = prev.filter((endpoint) => endpoint.id !== endpointId);
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
    if (!response.ok) {
      throw new Error('Failed to resolve location from map.');
    }

    const data = (await response.json()) as {
      display_name?: string;
      address?: NominatimAddress;
      error?: string;
    };

    if (data.error || !data.display_name) {
      throw new Error(data.error || 'No address found for selected point.');
    }

    return formatLocationFromAddress(data.display_name, data.address);
  };

  const resolvePointFromAddress = useCallback(async (addressQuery: string): Promise<MapPoint | null> => {
    const query = addressQuery.trim();
    if (query.length < 2) return null;
    const cacheKey = query.toLowerCase();
    const cached = geocodeCacheRef.current.get(cacheKey);
    if (cached) return cached;

    let point: MapPoint | null = null;

    if (ORS_API_KEY) {
      try {
        point = await fetchOrsPointFromAddress(query);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'OpenRouteService geocoding failed.';
        setMapError(message);
      }
    }

    if (!point) {
      point = await fetchNominatimPointFromAddress(query);
    }

    if (!point) return null;

    geocodeCacheRef.current.set(cacheKey, point);
    return point;
  }, []);

  const fetchDrivingMetrics = useCallback(
    async (from: MapPoint, to: MapPoint): Promise<{ distanceMeters: number; durationSeconds: number }> => {
      const cacheKey = `${from.lng},${from.lat}|${to.lng},${to.lat}`;
      const cached = directionsCacheRef.current.get(cacheKey);
      if (cached) return cached;

      if (!ORS_API_KEY) {
        throw new Error('Missing OpenRouteService API key. Set VITE_ORS_API_KEY and restart the dev server.');
      }

      const response = await fetch(ORS_DIRECTIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, application/geo+json',
          Authorization: ORS_API_KEY,
        },
        body: JSON.stringify({
          coordinates: [
            [from.lng, from.lat],
            [to.lng, to.lat],
          ],
          instructions: false,
          preference: 'fastest',
        }),
      });

      if (!response.ok) {
        const detail = await getOrsErrorMessage(response);
        throw new Error(detail || 'Distance service is currently unavailable.');
      }

      const data = (await response.json()) as OrsDirectionsResponse;
      const summary = data?.routes?.[0]?.summary;
      const rawDistance = Number(summary?.distance);
      const rawDuration = Number(summary?.duration);
      if (!Number.isFinite(rawDistance) || rawDistance <= 0) {
        throw new Error('Could not calculate route distance.');
      }
      const result = {
        distanceMeters: rawDistance,
        durationSeconds: Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 0,
      };
      directionsCacheRef.current.set(cacheKey, result);
      return result;
    },
    []
  );

  const handleEndpointLabelChange = (endpointId: string, label: string) => {
    setMapError(null);
    setEndpoints((prev) =>
      prev.map((endpoint) =>
        endpoint.id === endpointId
          ? {
              ...endpoint,
              label,
              point: label.trim().length >= 2 ? endpoint.point : null,
            }
          : endpoint
      )
    );

    const existingTimeout = endpointLookupTimeoutsRef.current[endpointId];
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    if (label.trim().length < 2) {
      return;
    }

    endpointLookupTimeoutsRef.current[endpointId] = setTimeout(async () => {
      try {
        setIsResolvingLocation(true);
        const point = await resolvePointFromAddress(label);
        if (!point) {
          setMapError(t('trips.form.tech.couldNotLocateOnMap', { label }));
          setEndpoints((prev) =>
            prev.map((endpoint) => (endpoint.id === endpointId ? { ...endpoint, point: null } : endpoint))
          );
          return;
        }

        setMapCenter(point);
        setEndpoints((prev) =>
          prev.map((endpoint) => (endpoint.id === endpointId ? { ...endpoint, point } : endpoint))
        );
        setErrors((prev) => ({ ...prev, endLocation: undefined }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not locate this stop on map.';
        setMapError(message);
        setEndpoints((prev) =>
          prev.map((endpoint) => (endpoint.id === endpointId ? { ...endpoint, point: null } : endpoint))
        );
      } finally {
        setIsResolvingLocation(false);
      }
    }, 550);
  };

  const handleMapClick = async (event: LeafletMouseEvent) => {
    const lat = event.latlng.lat;
    const lng = event.latlng.lng;

    const point: MapPoint = { lat, lng };
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
        const message = error instanceof Error ? error.message : 'Could not resolve the selected point.';
        setMapError(message);
      } finally {
        setIsResolvingLocation(false);
      }

      return;
    }

    if (!activeEndpointId) {
      setMapError(t('trips.form.tech.chooseEndpointFirst'));
      return;
    }

    try {
      setIsResolvingLocation(true);
      const address = await resolveAddress(point);
      if (!address) return;

      setEndpoints((prev) =>
        prev.map((endpoint) =>
          endpoint.id === activeEndpointId
            ? {
                ...endpoint,
                label: address,
                point,
              }
            : endpoint
        )
      );

      setErrors((prev) => ({ ...prev, endLocation: undefined }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not resolve the selected point.';
      setMapError(message);
    } finally {
      setIsResolvingLocation(false);
    }
  };

  useEffect(() => {
    const readyEndpoints = endpoints.filter((endpoint) => endpoint.point && endpoint.label.trim().length > 0) as Array<Endpoint & { point: MapPoint }>;

    if (!startPoint || readyEndpoints.length === 0 || readyEndpoints.length !== endpoints.length) {
      setRoutePlan(null);
      return;
    }

    let cancelled = false;

    const optimizeRoute = async () => {
      try {
        setIsOptimizingRoute(true);
        setMapError(null);

        const coordinates = [startPoint, ...readyEndpoints.map((endpoint) => endpoint.point)];
        const coordinateString = coordinates.map((point) => `${point.lng},${point.lat}`).join(';');
        const params = new URLSearchParams({
          source: 'first',
          roundtrip: 'false',
          steps: 'false',
          overview: 'false',
          geometries: 'geojson',
        });

        const response = await fetch(`https://router.project-osrm.org/trip/v1/driving/${coordinateString}?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to optimize route.');
        }

        const data = (await response.json()) as {
          code?: string;
          message?: string;
          trips?: Array<{ distance: number; duration?: number }>;
          waypoints?: OsrmWaypoint[];
        };

        if (data.code !== 'Ok' || !data.trips?.length || !data.waypoints?.length) {
          throw new Error(data.message || 'Could not compute route for selected points.');
        }

        const remainingEndpoints = [...readyEndpoints];

        const orderedStops = data.waypoints
          .map((waypoint, inputIndex) => {
            const waypointIndex = typeof waypoint.waypoint_index === 'number' ? waypoint.waypoint_index : inputIndex;

            // Ignore the start point (source=first), endpoints start at waypoint_index >= 1
            if (waypointIndex < 1) {
              return null;
            }

            const waypointLocation = waypoint.location;
            let matchedEndpointIndex = -1;

            if (
              Array.isArray(waypointLocation) &&
              waypointLocation.length === 2 &&
              Number.isFinite(waypointLocation[0]) &&
              Number.isFinite(waypointLocation[1])
            ) {
              const waypointPoint: MapPoint = { lat: waypointLocation[1], lng: waypointLocation[0] };
              let bestDistance = Number.POSITIVE_INFINITY;

              for (let i = 0; i < remainingEndpoints.length; i += 1) {
                const candidate = remainingEndpoints[i];
                const dist = squaredDistance(waypointPoint, candidate.point);
                if (dist < bestDistance) {
                  bestDistance = dist;
                  matchedEndpointIndex = i;
                }
              }
            }

            // Fallback mapping if waypoint location is missing
            if (matchedEndpointIndex < 0) {
              const fallbackIndex = Math.max(0, Math.min(inputIndex - 1, remainingEndpoints.length - 1));
              matchedEndpointIndex = fallbackIndex;
            }

            if (matchedEndpointIndex < 0 || matchedEndpointIndex >= remainingEndpoints.length) {
              return null;
            }

            const [matchedEndpoint] = remainingEndpoints.splice(matchedEndpointIndex, 1);

            return {
              waypointIndex,
              endpointId: matchedEndpoint.id,
              label: matchedEndpoint.label,
              point: matchedEndpoint.point,
            };
          })
          .filter((entry): entry is { waypointIndex: number; endpointId: string; label: string; point: MapPoint } => Boolean(entry))
          .sort((a, b) => a.waypointIndex - b.waypointIndex)
          .map(({ endpointId, label, point }) => ({ endpointId, label, point }));

        if (orderedStops.length !== readyEndpoints.length) {
          throw new Error('Could not resolve optimized stop order.');
        }

        const distanceKm = data.trips[0].distance / 1000;
        const durationSeconds = Number.isFinite(data.trips[0].duration)
          ? Number(data.trips[0].duration)
          : null;
        const nextPlan: RoutePlan = {
          distanceKm,
          durationSeconds,
          orderedStops,
          source: 'optimized',
        };

        if (cancelled) return;

        setRoutePlan(nextPlan);
        setValues((prev) => ({
          ...prev,
          endLocation: orderedStops[orderedStops.length - 1]?.label || '',
          distance: distanceKm.toFixed(1),
        }));
        setErrors((prev) => ({ ...prev, endLocation: undefined, distance: undefined }));
      } catch {
        if (cancelled) return;
        const fallbackOrderedStops = readyEndpoints.map((endpoint) => ({
          endpointId: endpoint.id,
          label: endpoint.label,
          point: endpoint.point,
        }));
        const fallbackDistance = calculatePathDistanceKm([startPoint, ...fallbackOrderedStops.map((stop) => stop.point)]);

        const fallbackPlan: RoutePlan = {
          distanceKm: fallbackDistance,
          durationSeconds: estimateFallbackDurationSeconds(fallbackDistance),
          orderedStops: fallbackOrderedStops,
          source: 'fallback',
        };

        setRoutePlan(fallbackPlan);
        setValues((prev) => ({
          ...prev,
          endLocation: fallbackOrderedStops[fallbackOrderedStops.length - 1]?.label || '',
          distance: fallbackDistance > 0 ? fallbackDistance.toFixed(1) : '',
        }));
        setErrors((prev) => ({ ...prev, endLocation: undefined, distance: undefined }));
        setMapError(t('trips.form.tech.routingFallback'));
      } finally {
        if (!cancelled) {
          setIsOptimizingRoute(false);
        }
      }
    };

    optimizeRoute();

    return () => {
      cancelled = true;
    };
  }, [startPoint, endpoints, t]);

  useEffect(() => {
    return () => {
      Object.values(endpointLookupTimeoutsRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

  useEffect(() => {
    const startAddress = values.startLocation.trim();
    const endAddress = values.endLocation.trim();

    if (startAddress.length < 2 || endAddress.length < 2) {
      setDistanceError(null);
      setDistanceMeters(null);
      setEstimatedDurationSeconds(null);
      if (!routePlan) {
        setValues((prev) => ({ ...prev, distance: '' }));
      }
      return;
    }

    if (!ORS_API_KEY) {
      setDistanceError(t('trips.form.tech.missingOrsKey'));
      setDistanceMeters(null);
      setEstimatedDurationSeconds(null);
      if (!routePlan) {
        setValues((prev) => ({ ...prev, distance: '' }));
      }
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsCalculatingDistance(true);
        setDistanceError(null);
        const [startCoords, endCoords] = await Promise.all([
          resolvePointFromAddress(startAddress),
          resolvePointFromAddress(endAddress),
        ]);

        if (!startCoords || !endCoords) {
          throw new Error('Could not find one of the addresses. Please refine the address text.');
        }

        const metrics = await fetchDrivingMetrics(startCoords, endCoords);
        setDistanceMeters(metrics.distanceMeters);
        setEstimatedDurationSeconds(metrics.durationSeconds);
        setValues((prev) => ({
          ...prev,
          distance: (metrics.distanceMeters / 1000).toFixed(1),
        }));
        setErrors((prev) => ({ ...prev, distance: undefined, startLocation: undefined, endLocation: undefined }));
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Could not calculate the distance right now. Please try again.';
        setDistanceError(message);
        setDistanceMeters(null);
        setEstimatedDurationSeconds(null);
      } finally {
        setIsCalculatingDistance(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [values.startLocation, values.endLocation, resolvePointFromAddress, fetchDrivingMetrics, routePlan, t]);

  const validate = () => {
    const nextErrors: Partial<Record<keyof TripFormValues, string>> = {};

    if (!values.vehicleId) nextErrors.vehicleId = t('trips.form.errors.vehicleRequired');
    if (!values.userId) nextErrors.userId = t('trips.form.errors.driverRequired');
    if (values.startLocation.trim().length < 2) nextErrors.startLocation = t('trips.form.errors.startRequired');
    if (values.endLocation.trim().length < 2) nextErrors.endLocation = t('trips.form.errors.destinationRequired');
    if (!values.startTime) nextErrors.startTime = t('trips.form.errors.startTimeRequired');
    if (!values.endTime) nextErrors.endTime = t('trips.form.errors.endTimeRequired');
    if (!values.region) nextErrors.region = t('trips.form.errors.regionRequired');
    if (!values.requiredCapacity || Number(values.requiredCapacity) <= 0) {
      nextErrors.requiredCapacity = t('trips.form.errors.capacityPositive');
    }

    if (values.startTime && values.endTime) {
      const startDate = new Date(values.startTime);
      const endDate = new Date(values.endTime);
      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime()) ||
        endDate <= startDate
      ) {
        nextErrors.endTime = 'ETA must be after the start time.';
      }
    }

    const distanceValue = Number(values.distance);

    if (!values.distance || Number.isNaN(distanceValue) || distanceValue <= 0) {
      nextErrors.distance = t('trips.form.errors.distancePositive');
    }
    if (isCalculatingDistance) {
      nextErrors.distance = t('trips.form.errors.distanceCalculating');
    }
    if (distanceMeters === null) {
      nextErrors.distance = t('trips.form.errors.distanceFromAddresses');
    }

    if (values.revenue.trim().length > 0) {
      const revenueValue = Number(values.revenue);
      if (Number.isNaN(revenueValue) || revenueValue < 0) {
        nextErrors.revenue = t('trips.form.errors.revenueInvalid');
      }
    }

    if (values.notes.trim().length === 1) {
      nextErrors.notes = t('trips.form.errors.notesLength');
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
      distance: Number(values.distance),
      distance_in_meters: distanceMeters ?? undefined,
      estimated_duration_seconds: estimatedDurationSeconds ?? undefined,
      fuel: estimatedFuelLiters !== null ? Number(estimatedFuelLiters.toFixed(2)) : undefined,
      revenue: values.revenue.trim().length > 0 ? Number(values.revenue) : undefined,
      notes: values.notes.trim() || undefined,
      requiredCapacity: Number(values.requiredCapacity),
      loadType: 'general',
      stops:

        intermediateStops.map((stop, index) => ({
          locationName: stop.label,
          stopOrder: index + 1,
          latitude: stop.point.lat,
          longitude: stop.point.lng,
        })) || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('trips.form.startLocation')}
          value={values.startLocation}
          onChange={(e) => onFieldChange('startLocation', e.target.value)}
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

        <div className="space-y-2">
          {endpoints.map((endpoint, index) => (
            <div key={endpoint.id} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center ${dark ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-700'}`}>
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
          ))}
        </div>
      </div>

      <div className={`rounded-2xl border p-4 space-y-3 ${dark ? 'border-slate-700/80 bg-slate-900/30' : 'border-slate-200/90 bg-white/70'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className={`text-sm font-semibold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{t('trips.form.mapSectionTitle')}</p>
            <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t('trips.form.mapSectionHint')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={pickerTarget === 'start' ? 'primary' : 'secondary'}
              onClick={() => {
                setPickerTarget('start');
                setActiveEndpointId(null);
              }}
              disabled={isResolvingLocation}
            >
              {t('trips.form.setStart')}
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-slate-200/70 dark:border-slate-700/70">
          <MapContainer
            center={mapCenter}
            zoom={9}
            style={{ width: '100%', height: '280px' }}
            className="z-0"
          >
            <TileLayer
              attribution={MAP_ATTRIBUTION}
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={handleMapClick} />
            {startPoint && (
              <CircleMarker center={startPoint} radius={8} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.85 }} />
            )}
            {endpoints.map(
              (endpoint, index) =>
                endpoint.point && (
                  <CircleMarker
                    key={endpoint.id}
                    center={endpoint.point}
                    radius={7}
                    pathOptions={{
                      color: activeEndpointId === endpoint.id ? '#0ea5e9' : '#ef4444',
                      fillColor: activeEndpointId === endpoint.id ? '#0ea5e9' : '#ef4444',
                      fillOpacity: 0.85,
                    }}
                  >
                    <title>{`Endpoint ${index + 1}`}</title>
                  </CircleMarker>
                )
            )}
          </MapContainer>
        </div>

        {routePlan && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${
            routePlan.source === 'optimized'
              ? dark
                ? 'border-emerald-900/40 bg-emerald-950/20 text-emerald-200'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : dark
                ? 'border-amber-900/40 bg-amber-950/20 text-amber-200'
                : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}>
            {routePlan.source === 'optimized' ? t('trips.form.optimizedOrder') : t('trips.form.fallbackOrder')}:{' '}
            {routePlan.orderedStops.map((stop, i) => `${i + 1}. ${stop.label}`).join(' -> ')}
            {routePlan.orderedStops.length > 0 && (
              <span>
                {t('trips.form.finalDestInline', {
                  label: routePlan.orderedStops[routePlan.orderedStops.length - 1]?.label,
                })}
              </span>
            )}
            {routePlan.durationSeconds && (
              <span>
                {' '}• ETA uses {formatDuration(routePlan.durationSeconds)} route time + 1h buffer
              </span>
            )}
          </div>
        )}

        {(isResolvingLocation || isOptimizingRoute || mapError) && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${mapError ? (dark ? 'border-red-900/50 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-700') : (dark ? 'border-slate-700 bg-slate-800/70 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700')}`}>
            {mapError || (isOptimizingRoute ? t('trips.form.optimizing') : t('trips.form.resolving'))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          label={t('trips.form.startDateTime')}
          type="datetime-local"
          value={values.startTime}
          onChange={(e) => onFieldChange('startTime', e.target.value)}
          error={errors.startTime}
        />
        <Input
          label={t('trips.form.endDateTime')}
          type="datetime-local"
          value={values.endTime}
          readOnly
          error={errors.endTime}
          helperText={etaHelperText}
          placeholder="Calculated from route + 1h"
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
        <div>
          <Input
            label={t('trips.form.distanceKm')}
            type="number"
            min="0"
            step="0.1"
            value={values.distance}
            error={errors.distance}
            placeholder={t('trips.form.distanceAutoPh')}
            readOnly
          />
          {isCalculatingDistance && (
            <p className="mt-1 text-xs text-slate-500">{t('trips.form.calculatingDistance')}</p>
          )}
          {distanceError && !errors.distance && (
            <p className="mt-1 text-xs text-red-600">{distanceError}</p>
          )}
        </div>
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

      <div>
        <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">{t('trips.form.notesOptional')}</label>
        <textarea
          value={values.notes}
          onChange={(e) => onFieldChange('notes', e.target.value)}
          rows={3}
          placeholder={t('trips.form.notesPlaceholder')}
          className={`w-full px-4 py-2.5 border text-sm rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand ${
            dark
              ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 hover:border-slate-600'
              : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 hover:border-gray-300'
          } ${errors.notes ? 'border-red-500' : ''}`}
        />
        {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
      </div>

      <div className={`flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl border ${dark ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-indigo-100 bg-indigo-50/50'} gap-4`}>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${dark ? 'text-indigo-300' : 'text-indigo-700'}`}>{t('trips.form.smartRecTitle')}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">{t('trips.form.smartRecHint')}</p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleGetRecommendations}
          isLoading={isFetchingRecs}
          disabled={!values.startLocation || isFetchingRecs}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm whitespace-nowrap"
        >
          {recommendations ? t('trips.form.refreshSuggestions') : t('trips.form.getMlSuggestions')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">{t('trips.form.vehicleLabel')}</label>
          <Select
            value={values.vehicleId}
            onChange={handleVehicleChange}
            dark={dark}
            options={vehicleOptions}
            className={errors.vehicleId ? '[&>button]:!border-red-500' : ''}
          />
          {errors.vehicleId && <p className="mt-1 text-sm text-red-600">{errors.vehicleId}</p>}
        </div>

        <div>
          <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">{t('trips.form.driverLabel')}</label>
          <Select
            value={values.userId}
            onChange={handleDriverChange}
            dark={dark}
            options={driverOptions}
            className={errors.userId ? '[&>button]:!border-red-500' : ''}
          />
          {errors.userId && <p className="mt-1 text-sm text-red-600">{errors.userId}</p>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={isCalculatingDistance || distanceMeters === null}
        >
          {t('trips.form.createTrip')}
        </Button>
      </div>
    </form>
  );
};

export default TripForm;
