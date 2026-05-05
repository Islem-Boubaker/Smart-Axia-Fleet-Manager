import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type { Trip } from '../../../types';
import 'leaflet/dist/leaflet.css';
import { compactLocationLabel } from '../utils/locationLabel';
import { useTranslation } from 'react-i18next';

type TripDetailsViewProps = {
  trip: Trip;
  dark?: boolean;
};

const MAP_ATTRIBUTION = '&copy; OpenStreetMap contributors';
const DEFAULT_MAP_CENTER: LatLngExpression = [36.8065, 10.1815];

type GeoPoint = {
  lat: number;
  lng: number;
};

type NominatimSearchResult = {
  lat?: string;
  lon?: string;
};

type OsrmRouteResponse = {
  code?: string;
  routes?: Array<{
    geometry?: {
      coordinates?: [number, number][];
    };
  }>;
};

const formatDateTime = (value: string | undefined, locale: string, fallback: string) => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale);
};

const formatNumber = (value: number | undefined, suffix: string, fallback: string) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return `${value.toFixed(1)}${suffix}`;
};

const geocodeLocation = async (query: string, signal: AbortSignal): Promise<GeoPoint | null> => {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const params = new URLSearchParams({
    format: 'jsonv2',
    q: trimmed,
    limit: '1',
    'accept-language': 'en',
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, { signal });
  if (!response.ok) return null;

  const results = (await response.json()) as NominatimSearchResult[];
  const first = results?.[0];
  if (!first?.lat || !first?.lon) return null;

  const lat = Number.parseFloat(first.lat);
  const lng = Number.parseFloat(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
};

type MapAutoFitProps = {
  points: LatLngExpression[];
};

const MapAutoFit = ({ points }: MapAutoFitProps) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    const tuplePoints: [number, number][] = points
      .map((point) => {
        if (Array.isArray(point)) {
          const [lat, lng] = point;
          const nLat = Number(lat);
          const nLng = Number(lng);
          return Number.isFinite(nLat) && Number.isFinite(nLng) ? [nLat, nLng] as [number, number] : null;
        }

        const nLat = Number(point.lat);
        const nLng = Number(point.lng);
        return Number.isFinite(nLat) && Number.isFinite(nLng) ? [nLat, nLng] as [number, number] : null;
      })
      .filter((point): point is [number, number] => point !== null);

    if (tuplePoints.length === 0) return;

    if (tuplePoints.length === 1) {
      map.setView(tuplePoints[0], 13, { animate: true });
      return;
    }

    map.fitBounds(tuplePoints, {
      padding: [24, 24],
      maxZoom: 14,
      animate: true,
    });
  }, [map, points]);

  return null;
};

const TripDetailsView = ({ trip, dark = false }: TripDetailsViewProps) => {
  const { t, i18n } = useTranslation();
  const normalizeStatusKey = (value: string) =>
    value.toLowerCase().replace(/\s+/g, '_').replace(/-+/g, '_');
  const [startMarker, setStartMarker] = useState<GeoPoint | null>(null);
  const [endMarker, setEndMarker] = useState<GeoPoint | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [roadPath, setRoadPath] = useState<LatLngExpression[] | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [isRoadFallback, setIsRoadFallback] = useState(false);

  const orderedStops = useMemo(
    () => (Array.isArray(trip.stops) ? [...trip.stops].sort((a, b) => a.stopOrder - b.stopOrder) : []),
    [trip.stops]
  );

  const mapStops = useMemo(
    () =>
      orderedStops.filter(
        (stop) => typeof stop.latitude === 'number' && Number.isFinite(stop.latitude) && typeof stop.longitude === 'number' && Number.isFinite(stop.longitude)
      ),
    [orderedStops]
  );

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const run = async () => {
      try {
        const hasExactStart =
          typeof trip.startLatitude === 'number' &&
          Number.isFinite(trip.startLatitude) &&
          typeof trip.startLongitude === 'number' &&
          Number.isFinite(trip.startLongitude);
        const hasExactEnd =
          typeof trip.endLatitude === 'number' &&
          Number.isFinite(trip.endLatitude) &&
          typeof trip.endLongitude === 'number' &&
          Number.isFinite(trip.endLongitude);

        if (hasExactStart || hasExactEnd) {
          setStartMarker(hasExactStart ? { lat: trip.startLatitude as number, lng: trip.startLongitude as number } : null);
          setEndMarker(hasExactEnd ? { lat: trip.endLatitude as number, lng: trip.endLongitude as number } : null);
          setIsGeocoding(false);
          return;
        }

        setIsGeocoding(true);
        const [startPoint, endPoint] = await Promise.all([
          geocodeLocation(trip.startLocation, controller.signal),
          geocodeLocation(trip.endLocation, controller.signal),
        ]);

        if (!isMounted) return;
        setStartMarker(startPoint);
        setEndMarker(endPoint);
      } finally {
        if (isMounted) setIsGeocoding(false);
      }
    };

    run();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [trip.endLatitude, trip.endLocation, trip.endLongitude, trip.id, trip.startLatitude, trip.startLocation, trip.startLongitude]);

  const routingPoints = useMemo<GeoPoint[]>(() => {
    const points: GeoPoint[] = [];
    if (startMarker) points.push(startMarker);
    for (const stop of mapStops) {
      points.push({ lat: stop.latitude as number, lng: stop.longitude as number });
    }
    if (endMarker) points.push(endMarker);
    return points;
  }, [startMarker, mapStops, endMarker]);

  useEffect(() => {
    if (routingPoints.length < 2) {
      setRoadPath(null);
      setIsRoadFallback(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchRoadRoute = async () => {
      try {
        setIsRouting(true);
        setIsRoadFallback(false);

        const coordinates = routingPoints
          .map((point) => `${point.lng},${point.lat}`)
          .join(';');

        const params = new URLSearchParams({
          overview: 'full',
          geometries: 'geojson',
        });

        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordinates}?${params.toString()}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error('Routing request failed');
        }

        const data = (await response.json()) as OsrmRouteResponse;
        const geometry = data?.routes?.[0]?.geometry?.coordinates;

        if (!geometry || geometry.length < 2) {
          throw new Error('Road geometry not available');
        }

        const osrmPath: LatLngExpression[] = geometry.map(([lng, lat]) => [lat, lng]);

        if (!isMounted) return;
        setRoadPath(osrmPath);
      } catch {
        if (!isMounted) return;
        setRoadPath(null);
        setIsRoadFallback(true);
      } finally {
        if (isMounted) setIsRouting(false);
      }
    };

    fetchRoadRoute();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [routingPoints]);

  const fallbackPath = useMemo<LatLngExpression[]>(
    () => routingPoints.map((point) => [point.lat, point.lng]),
    [routingPoints]
  );

  const displayPath = roadPath && roadPath.length > 1 ? roadPath : fallbackPath;
  const mapCenter: LatLngExpression = routingPoints.length > 0 ? [routingPoints[0].lat, routingPoints[0].lng] : DEFAULT_MAP_CENTER;

  const summaryItems: Array<[string, string]> = [
    [t('common.status'), t(`status.${normalizeStatusKey(trip.status)}`)],
    [t('common.driver'), trip.driver?.name || t('common.unassigned')],
    [
      t('common.vehicle'),
      [trip.vehicle?.name, trip.vehicle?.plaque_immatriculation].filter(Boolean).join(' - ') || t('trips.card.unknownVehicle'),
    ],
    [t('common.distance'), formatNumber(trip.distance, ` ${t('common.kmUnit')}`, t('common.na'))],
    [t('common.fuel'), formatNumber(trip.fuel, ` ${t('common.liters')}`, t('common.na'))],
    [
      t('common.revenue'),
      typeof trip.revenue === 'number' ? `${trip.revenue.toFixed(1)} ${t('common.currencyTnd')}` : t('common.na'),
    ],
    [t('common.start'), formatDateTime(trip.startTime, i18n.language, t('common.na'))],
    [t('common.end'), formatDateTime(trip.endTime, i18n.language, t('common.na'))],
  ];

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-4 ${dark ? 'border-slate-700/80 bg-slate-900/45' : 'border-slate-200/90 bg-white/80'}`}>
        <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t('common.route')}</p>
        <p className={`mt-2 text-base font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
          {compactLocationLabel(trip.startLocation)}
          <span className="mx-2 opacity-60">→</span>
          {compactLocationLabel(trip.endLocation)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {summaryItems.map(([label, value]) => (
          <div
            key={label}
            className={`rounded-xl border px-4 py-3 ${dark ? 'border-slate-700/80 bg-slate-800/50' : 'border-slate-200 bg-slate-50/90'}`}
          >
            <p className={`text-[11px] font-semibold uppercase tracking-wide ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
            <p className={`mt-1 text-sm font-medium ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl border p-4 ${dark ? 'border-slate-700/80 bg-slate-900/45' : 'border-slate-200/90 bg-white/80'}`}>
        <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          {t('trips.details.stopsCount', { count: orderedStops.length })}
        </p>

        {orderedStops.length === 0 ? (
          <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{t('trips.details.noStops')}</p>
        ) : (
          <div className="space-y-2">
            {orderedStops.map((stop) => (
              <div key={stop.id} className={`rounded-xl border px-3 py-2 ${dark ? 'border-slate-700/70 bg-slate-800/40' : 'border-slate-200 bg-slate-50/80'}`}>
                <p className={`text-sm font-medium ${dark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {compactLocationLabel(stop.locationName)}
                </p>
                <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {t('common.status')}: {t(`trips.stopStatus.${normalizeStatusKey(stop.status)}`, { defaultValue: stop.status })}{' '}
                  {stop.arrivalTime ? t('trips.details.arrivalBullet', { date: formatDateTime(stop.arrivalTime, i18n.language, t('common.na')) }) : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`rounded-2xl border p-4 ${dark ? 'border-slate-700/80 bg-slate-900/45' : 'border-slate-200/90 bg-white/80'}`}>
        <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          {t('trips.details.routeMap')}
        </p>

        {routingPoints.length === 0 ? (
          <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
            {isGeocoding
              ? t('trips.details.resolvingMarkers')
              : t('trips.details.mapUnavailable')}
          </p>
        ) : (
          <div className="space-y-2">
            {(isRouting || isRoadFallback) && (
              <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                {isRouting
                  ? t('trips.details.calculatingRoute')
                  : t('trips.details.routeFallback')}
              </p>
            )}
            <div className="overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-700/70">
              <MapContainer center={mapCenter} zoom={10} style={{ width: '100%', height: '300px' }} className="z-0">
                <TileLayer attribution={MAP_ATTRIBUTION} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapAutoFit points={displayPath.length > 0 ? displayPath : fallbackPath} />
                {displayPath.length > 1 && <Polyline positions={displayPath} pathOptions={{ color: '#0ea5e9', weight: 4, opacity: 0.8 }} />}
                {startMarker && (
                  <CircleMarker
                    center={[startMarker.lat, startMarker.lng]}
                    radius={8}
                    pathOptions={{
                      color: '#22c55e',
                      fillColor: '#22c55e',
                      fillOpacity: 0.95,
                    }}
                  />
                )}
                {mapStops.map((stop) => {
                  const isReached = stop.status === 'reached' || stop.status === 'skipped';
                  return (
                    <CircleMarker
                      key={stop.id}
                      center={[stop.latitude as number, stop.longitude as number]}
                      radius={7}
                      pathOptions={{
                        color: isReached ? '#64748b' : '#ef4444',
                        fillColor: isReached ? '#64748b' : '#ef4444',
                        fillOpacity: 0.9,
                      }}
                    />
                  );
                })}
                {endMarker && (
                  <CircleMarker
                    center={[endMarker.lat, endMarker.lng]}
                    radius={8}
                    pathOptions={{
                      color: '#2563eb',
                      fillColor: '#2563eb',
                      fillOpacity: 0.95,
                    }}
                  />
                )}
              </MapContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripDetailsView;
