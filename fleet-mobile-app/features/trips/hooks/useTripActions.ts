import { useCallback, useState } from "react";
import { tripsApi } from "../services/trips.api";

export function useTripActions() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAction = useCallback(
    async <T>(executor: () => Promise<T>): Promise<T> => {
      setIsSubmitting(true);
      setError(null);
      try {
        return await executor();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Trip action failed";
        setError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const startTrip = useCallback(
    (tripId: string) => {
      return runAction(() => tripsApi.startTrip(tripId));
    },
    [runAction],
  );

  const completeTrip = useCallback(
    (
      tripId: string,
      completion?: { endTime?: string; fuel?: string; cost?: number },
    ) => {
      return runAction(() => tripsApi.completeTrip(tripId, completion));
    },
    [runAction],
  );

  const cancelTrip = useCallback(
    (tripId: string) => {
      return runAction(() => tripsApi.cancelTrip(tripId));
    },
    [runAction],
  );

  const sendLocationPing = useCallback(
    (
      tripId: string,
      payload: {
        latitude: number;
        longitude: number;
        speed?: number;
        heading?: number;
        accuracy?: number;
        timestamp?: string;
      },
    ) => {
      return runAction(() => tripsApi.sendLocationPing(tripId, payload));
    },
    [runAction],
  );

  const markStopReached = useCallback(
    (tripId: string, stopId: string, arrivalTime?: string) => {
      return runAction(() =>
        tripsApi.markStopReached(tripId, stopId, arrivalTime),
      );
    },
    [runAction],
  );

  const markStopSkipped = useCallback(
    (tripId: string, stopId: string, notes?: string) => {
      return runAction(() => tripsApi.markStopSkipped(tripId, stopId, notes));
    },
    [runAction],
  );

  return {
    isSubmitting,
    error,
    startTrip,
    completeTrip,
    cancelTrip,
    sendLocationPing,
    markStopReached,
    markStopSkipped,
  };
}
