import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type { Trip } from '../../../types';
import 'leaflet/dist/leaflet.css';
import { compactLocationLabel } from '../utils/locationLabel';
import { TranslatedText } from '../../../shared/components/TranslatedText';
import { tripsService, type TripLiveLocation } from '../services/trips.service';

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

const formatRelativeTime = (value: string | undefined, t: (key: string, options?: Record<string, unknown>) => string) => {
  if (!value) return t('trips.details.live.unknownTime');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t('trips.details.live.unknownTime');

  const diffSeconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 10) return t('trips.details.live.justNow');
  if (diffSeconds < 60) return t('trips.details.live.secondsAgo', { count: diffSeconds });

  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return t('trips.details.live.minutesAgo', { count: diffMinutes });

  const diffHours = Math.round(diffMinutes / 60);
  return t('trips.details.live.hoursAgo', { count: diffHours });
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
  const [startMarker, setStartMarker] = useState<GeoPoint | null>(null);
  const [endMarker, setEndMarker] = useState<GeoPoint | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [roadPath, setRoadPath] = useState<LatLngExpression[] | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [isRoadFallback, setIsRoadFallback] = useState(false);
  const [liveLocation, setLiveLocation] = useState<TripLiveLocation | null>(null);
  const [isLiveLocationLoading, setIsLiveLocationLoading] = useState(false);
  const [liveLocationError, setLiveLocationError] = useState<string | null>(null);
  const isOngoingTrip = trip.status === 'ongoing';

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

  useEffect(() => {
    if (!isOngoingTrip) {
      setLiveLocation(null);
      setIsLiveLocationLoading(false);
      setLiveLocationError(null);
      return;
    }

    let isMounted = true;

    const fetchLiveLocation = async (showLoading = false) => {
      try {
        if (showLoading) setIsLiveLocationLoading(true);
        const nextLocation = await tripsService.getLiveLocation(trip.id);
        if (!isMounted) return;
        setLiveLocation(nextLocation);
        setLiveLocationError(null);
      } catch (error) {
        if (!isMounted) return;
        const message =
          (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
          (error as Error)?.message ||
          'Unable to load driver location.';
        setLiveLocationError(message);
      } finally {
        if (isMounted) setIsLiveLocationLoading(false);
      }
    };

    void fetchLiveLocation(true);
    const intervalId = window.setInterval(() => {
      void fetchLiveLocation(false);
    }, 10_000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [isOngoingTrip, trip.id]);

  const fallbackPath = useMemo<LatLngExpression[]>(
    () => routingPoints.map((point) => [point.lat, point.lng]),
    [routingPoints]
  );

  const driverLivePoint = useMemo<GeoPoint | null>(() => {
    if (!liveLocation) return null;
    const lat = Number(liveLocation.latitude);
    const lng = Number(liveLocation.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }, [liveLocation]);

  const displayPath = roadPath && roadPath.length > 1 ? roadPath : fallbackPath;
  const mapFitPoints = useMemo<LatLngExpression[]>(() => {
    const points = displayPath.length > 0 ? [...displayPath] : [...fallbackPath];
    if (driverLivePoint) points.push([driverLivePoint.lat, driverLivePoint.lng]);
    return points;
  }, [displayPath, driverLivePoint, fallbackPath]);

  const mapCenter: LatLngExpression =
    routingPoints.length > 0
      ? [routingPoints[0].lat, routingPoints[0].lng]
      : driverLivePoint
        ? [driverLivePoint.lat, driverLivePoint.lng]
        : DEFAULT_MAP_CENTER;

  const liveLocationStatus = useMemo(() => {
    if (!isOngoingTrip) return null;
    if (liveLocation) {
      const accuracy = typeof liveLocation.accuracy === 'number' ? ` ${t('common.dashBullet')}${t('trips.details.live.accuracy', { count: Math.round(liveLocation.accuracy) })}` : '';
      const stale = liveLocation.isStale ? ` ${t('common.dashBullet')}${t('trips.details.live.signalOld')}` : '';
      return `${t('trips.details.live.updated', { when: formatRelativeTime(liveLocation.recordedAt, t) })}${accuracy}${stale}`;
    }
    if (isLiveLocationLoading) return t('trips.details.live.waiting');
    if (liveLocationError) return liveLocationError;
    return t('trips.details.live.notReceived');
  }, [isLiveLocationLoading, isOngoingTrip, liveLocation, liveLocationError, t]);


  const summaryItems: Array<[string, string]> = [
    [t('common.status'), t(`status.${String(trip.status || '').toLowerCase().replace(/\s+/g, '_')}`)],
    [t('common.driver'), trip.driver?.name || t('common.unassigned')],
    [t('common.vehicle'), [trip.vehicle?.name, trip.vehicle?.plaque_immatriculation].filter(Boolean).join(' - ') || t('common.unknownVehicle')],
    [t('common.distance'), formatNumber(trip.distance, ` ${t('common.kmUnit')}`, t('common.na'))],
    [t('common.fuel'), formatNumber(trip.fuel, ` ${t('common.liters')}`, t('common.na'))],
    [t('common.revenue'), typeof trip.revenue === 'number' ? `${trip.revenue.toFixed(1)} ${t('common.currencyTnd')}` : t('common.na')],
    [t('common.start'), formatDateTime(trip.startTime, i18n.language, t('common.na'))],
    [t('common.end'), formatDateTime(trip.endTime, i18n.language, t('common.na'))],
  ];

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-4 ${dark ? 'border-slate-700/80 bg-slate-900/45' : 'border-slate-200/90 bg-white/80'}`}>
        <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t('common.route')}</p>
        <p className={`mt-2 text-base font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
          {compactLocationLabel(trip.startLocation)}
          <span className="mx-2 opacity-60">{t('common.arrow')}</span>
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
                <TranslatedText
                  as="p"
                  text={compactLocationLabel(stop.locationName)}
                  className={`text-sm font-medium ${dark ? 'text-slate-100' : 'text-slate-900'}`}
                />
                <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {t('common.status')}: {t(`trips.stopStatus.${String(stop.status || '').toLowerCase()}`)} {stop.arrivalTime ? `${t('common.dashBullet')}${formatDateTime(stop.arrivalTime, i18n.language, t('common.na'))}` : ''}
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

        {liveLocationStatus ? (
          <div
            className={`mb-3 rounded-xl border px-3 py-2 text-xs ${
              dark
                ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100'
                : 'border-cyan-100 bg-cyan-50 text-cyan-800'
            }`}
          >
            {liveLocationStatus}
          </div>
        ) : null}

        {routingPoints.length === 0 && !driverLivePoint ? (
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
                <MapAutoFit points={mapFitPoints} />
                {displayPath.length > 1 && <Polyline positions={displayPath} pathOptions={{ color: '#0ea5e9', weight: 4, opacity: 0.8 }} />}
                {driverLivePoint && (
                  <>
                    <CircleMarker
                      center={[driverLivePoint.lat, driverLivePoint.lng]}
                      radius={22}
                      pathOptions={{
                        color: liveLocation?.isStale ? '#f59e0b' : '#06b6d4',
                        fillColor: liveLocation?.isStale ? '#f59e0b' : '#06b6d4',
                        fillOpacity: 0.14,
                        opacity: 0.35,
                        weight: 2,
                      }}
                    />
                    <CircleMarker
                      center={[driverLivePoint.lat, driverLivePoint.lng]}
                      radius={9}
                      pathOptions={{
                        color: liveLocation?.isStale ? '#f59e0b' : '#06b6d4',
                        fillColor: liveLocation?.isStale ? '#f59e0b' : '#06b6d4',
                        fillOpacity: 0.95,
                        weight: 3,
                      }}
                    >
                      <Popup>
                        <div className="space-y-1">
                          <p className="font-semibold">{t('trips.details.live.driverLocation')}</p>
                          <p>{liveLocation?.driver?.name || trip.driver?.name || t('common.driverLabel')}</p>
                          <p>{t('trips.details.live.updated', { when: formatRelativeTime(liveLocation?.recordedAt, t) })}</p>
                          {typeof liveLocation?.accuracy === 'number' ? (
                            <p>{t('trips.details.live.accuracy', { count: Math.round(liveLocation.accuracy) })}</p>
                          ) : null}
                        </div>
                      </Popup>
                    </CircleMarker>
                  </>
                )}
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
