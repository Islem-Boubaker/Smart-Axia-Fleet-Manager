import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import type { LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button, Input, Select } from '../../../shared/components';
import type { Driver, Vehicle } from '../../../types';
import { formatLocationFromAddress } from '../utils/locationLabel';

type TripFormValues = {
  vehicleId: string;
  userId: string;
  startLocation: string;
  endLocation: string;
  startTime: string;
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
    distance: number;
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

const squaredDistance = (a: MapPoint, b: MapPoint) => {
  const dLat = a.lat - b.lat;
  const dLng = a.lng - b.lng;
  return dLat * dLat + dLng * dLng;
};

const TripForm = ({ vehicles, drivers, dark = false, isSubmitting = false, onSubmit, onCancel }: TripFormProps) => {
  const [values, setValues] = useState<TripFormValues>({
    vehicleId: '',
    userId: '',
    startLocation: '',
    endLocation: '',
    startTime: '',
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
  const endpointLookupTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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

  const vehicleOptions = useMemo(
    () => [
      { value: '', label: 'Select a vehicle' },
      ...sortedVehicles.map((vehicle) => ({
        value: vehicle.id,
        label: buildVehicleLabel(vehicle),
      })),
    ],
    [sortedVehicles]
  );

  const driverOptions = useMemo(
    () => [
      { value: '', label: 'Select a driver' },
      ...sortedDrivers.map((driver) => ({
        value: driver.id,
        label: driver.name,
      })),
    ],
    [sortedDrivers]
  );

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

  const resolvePointFromAddress = async (addressQuery: string): Promise<MapPoint | null> => {
    const query = addressQuery.trim();
    if (query.length < 2) return null;

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
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return { lat, lng };
  };

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
          setMapError(`Could not locate "${label}" on map.`);
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
      setMapError('Choose an endpoint row first, then click on the map.');
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
      setValues((prev) => ({ ...prev, endLocation: '', distance: '' }));
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
          trips?: Array<{ distance: number }>;
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
        const nextPlan: RoutePlan = {
          distanceKm,
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
      } catch (error) {
        if (cancelled) return;
        const fallbackOrderedStops = readyEndpoints.map((endpoint) => ({
          endpointId: endpoint.id,
          label: endpoint.label,
          point: endpoint.point,
        }));
        const fallbackDistance = calculatePathDistanceKm([startPoint, ...fallbackOrderedStops.map((stop) => stop.point)]);

        const fallbackPlan: RoutePlan = {
          distanceKm: fallbackDistance,
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
        setMapError('Routing service unavailable. Using endpoint order as entered with estimated distance.');
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
  }, [startPoint, endpoints]);

  useEffect(() => {
    return () => {
      Object.values(endpointLookupTimeoutsRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

  const validate = () => {
    const nextErrors: Partial<Record<keyof TripFormValues, string>> = {};

    if (!values.vehicleId) nextErrors.vehicleId = 'Vehicle is required.';
    if (!values.userId) nextErrors.userId = 'Driver is required.';
    if (values.startLocation.trim().length < 2) nextErrors.startLocation = 'Start location must be at least 2 characters.';
    if (values.endLocation.trim().length < 2) nextErrors.endLocation = 'Add at least one endpoint and pick points on the map.';
    if (!values.startTime) nextErrors.startTime = 'Start date/time is required.';

    const distanceValue = Number(values.distance);
    if (!values.distance || Number.isNaN(distanceValue) || distanceValue <= 0) {
      nextErrors.distance = 'Distance must be a positive number.';
    }

    if (values.revenue.trim().length > 0) {
      const revenueValue = Number(values.revenue);
      if (Number.isNaN(revenueValue) || revenueValue < 0) {
        nextErrors.revenue = 'Revenue must be a valid non-negative number.';
      }
    }

    if (values.notes.trim().length === 1) {
      nextErrors.notes = 'Notes must be at least 2 characters if provided.';
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
      distance: Number(values.distance),
      fuel: estimatedFuelLiters !== null ? Number(estimatedFuelLiters.toFixed(2)) : undefined,
      revenue: values.revenue.trim().length > 0 ? Number(values.revenue) : undefined,
      notes: values.notes.trim() || undefined,
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
        <div>
          <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">Vehicle</label>
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
          <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">Driver</label>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Start location"
          value={values.startLocation}
          error={errors.startLocation}
          placeholder="Choose start point from map"
          readOnly
        />
        <Input
          label="Final destination"
          value={values.endLocation}
          error={errors.endLocation}
          placeholder="Calculated from optimized route"
          readOnly
        />
      </div>

      <div className={`rounded-2xl border p-4 space-y-3 ${dark ? 'border-slate-700/80 bg-slate-900/30' : 'border-slate-200/90 bg-white/70'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`text-sm font-semibold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>Endpoints</p>
            <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              Add endpoints on the map. The final endpoint becomes the destination, and earlier endpoints are stored as stops.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={addEndpoint}
            disabled={isResolvingLocation || isOptimizingRoute}
          >
            Add stop
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
                placeholder="Type stop name/address or set from map"
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                variant={activeEndpointId === endpoint.id && pickerTarget === 'end' ? 'primary' : 'secondary'}
                onClick={() => beginEndpointPick(endpoint.id)}
                disabled={isResolvingLocation || isOptimizingRoute}
              >
                Set
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => removeEndpoint(endpoint.id)}
                disabled={endpoints.length === 1 || isResolvingLocation || isOptimizingRoute}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className={`rounded-2xl border p-4 space-y-3 ${dark ? 'border-slate-700/80 bg-slate-900/30' : 'border-slate-200/90 bg-white/70'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className={`text-sm font-semibold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>Pick locations on map</p>
            <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              Pick Start for the departure point, then choose endpoint rows and click map to set each stop.
            </p>
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
              Set start
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
            {routePlan.source === 'optimized' ? 'Optimized route order' : 'Fallback route order'}: {routePlan.orderedStops.map((stop, i) => `${i + 1}. ${stop.label}`).join(' -> ')}
            {routePlan.orderedStops.length > 0 && (
              <span>
                {' '}• Final destination: {routePlan.orderedStops[routePlan.orderedStops.length - 1]?.label}
              </span>
            )}
          </div>
        )}

        {(isResolvingLocation || isOptimizingRoute || mapError) && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${mapError ? (dark ? 'border-red-900/50 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-700') : (dark ? 'border-slate-700 bg-slate-800/70 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700')}`}>
            {mapError || (isOptimizingRoute ? 'Optimizing best route and total distance...' : 'Resolving selected location...')}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Start date/time"
          type="datetime-local"
          value={values.startTime}
          onChange={(e) => onFieldChange('startTime', e.target.value)}
          error={errors.startTime}
        />
        <Input
          label="Distance (km)"
          type="number"
          min="1"
          step="0.1"
          value={values.distance}
          error={errors.distance}
          placeholder="Calculated automatically"
          readOnly
        />
        <Input
          label="Revenue (TND)"
          type="number"
          min="0"
          step="0.1"
          value={values.revenue}
          onChange={(e) => onFieldChange('revenue', e.target.value)}
          error={errors.revenue}
          placeholder="Optional"
        />
      </div>

      <div>
        <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">Notes (optional)</label>
        <textarea
          value={values.notes}
          onChange={(e) => onFieldChange('notes', e.target.value)}
          rows={3}
          placeholder="Trip instructions, cargo details, or anything important for the driver..."
          className={`w-full px-4 py-2.5 border text-sm rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand ${
            dark
              ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 hover:border-slate-600'
              : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 hover:border-gray-300'
          } ${errors.notes ? 'border-red-500' : ''}`}
        />
        {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
      </div>

      <div className={`rounded-xl border px-4 py-3 text-sm ${dark ? 'border-slate-700 bg-slate-800/60 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
        Estimated fuel consumption:{' '}
        {estimatedFuelLiters !== null
          ? `${estimatedFuelLiters.toFixed(1)} L${selectedVehicle?.consumption ? ` (based on ${selectedVehicle.consumption} L/100km)` : ''}`
          : 'Select a vehicle with Consumption (L/100km) and complete route points to estimate fuel.'}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Create trip
        </Button>
      </div>
    </form>
  );
};

export default TripForm;
