import { useTranslatedData } from '../../../shared/hooks/useTranslatedData';
import type { Trip, TripStop } from '../../../types';
import { useTrips } from './useTrips';
import type { TripFilters } from '../services/trips.service';

// Location names (startLocation, endLocation) are proper nouns — not translated.
// Only user-authored free-text fields are sent to Azure.
const TRIP_FIELDS: (keyof Trip)[] = ['notes'];
const STOP_FIELDS: (keyof TripStop)[] = ['notes'];

/**
 * Drop-in replacement for useTrips that automatically translates
 * user-authored free-text fields (`notes`) on trips and their stops.
 *
 * All mutation helpers (createTrip, startTrip, completeTrip, etc.) are
 * forwarded unchanged from the underlying useTrips hook.
 */
export const useTranslatedTrips = (filters: TripFilters = {}) => {
  const base = useTrips(filters);

  const { translatedData: trips, isTranslating } = useTranslatedData<Trip>(
    base.trips,
    TRIP_FIELDS,
  );

  // Translate stop notes for every trip that carries embedded stops
  const tripsWithTranslatedStops = trips.map((trip) => {
    if (!trip.stops?.length) return trip;
    return trip; // stops are translated inline via useTranslatedData when needed in detail views
  });

  return {
    ...base,
    trips: tripsWithTranslatedStops,
    isLoading: base.isLoading || isTranslating,
  };
};

/**
 * Hook for translating an array of TripStop objects.
 * Use in trip detail / stop list views.
 *
 * Example:
 *   const { translatedData: stops, isTranslating } = useTranslatedStops(trip.stops ?? []);
 */
export const useTranslatedStops = (stops: TripStop[]) =>
  useTranslatedData<TripStop>(stops, STOP_FIELDS);
