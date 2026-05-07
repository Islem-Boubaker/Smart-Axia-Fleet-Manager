import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { tripsApi } from "../services/trips.api";
import type { Trip } from "../types/trip.types";

interface UseTripDetailState {
  trip: Trip | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useTripDetail(tripId?: string): UseTripDetailState {
  const { t } = useTranslation();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrip = useCallback(async () => {
    if (!tripId) {
      setTrip(null);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await tripsApi.getTripDetail(tripId);
      setTrip(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("trips.failedToLoad");
      setError(message);
      setTrip(null);
    } finally {
      setIsLoading(false);
    }
  }, [t, tripId]);

  useEffect(() => {
    setIsLoading(true);
    fetchTrip();
  }, [fetchTrip]);

  return {
    trip,
    isLoading,
    error,
    reload: fetchTrip,
  };
}
