import { useEffect, useState } from "react";
import { api } from "@/shared/services/api";

const vehicleDetailsCache = new Map<string, any>();

export function useVehicleDetails(vehicleId: string | null, initialVehicle?: any | null) {
  const [vehicle, setVehicle] = useState<any | null>(() => {
    if (vehicleId && vehicleDetailsCache.has(vehicleId)) return vehicleDetailsCache.get(vehicleId);
    return initialVehicle ?? null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleId) {
      setVehicle(initialVehicle ?? null);
      setError(null);
      setLoading(false);
      return;
    }

    const cachedVehicle = vehicleDetailsCache.get(vehicleId);
    if (cachedVehicle) {
      setVehicle(cachedVehicle);
      setError(null);
      setLoading(false);
      return;
    }

    if (initialVehicle) {
      setVehicle(initialVehicle);
    }

    let isCancelled = false;
    setLoading(true);
    setError(null);
    api
      .get(`/vehicle/getvehicle/${vehicleId}`)
      .then((res) => {
        if (isCancelled) return;
        const nextVehicle = res.data?.data || null;
        if (nextVehicle) vehicleDetailsCache.set(vehicleId, nextVehicle);
        setVehicle(nextVehicle ?? initialVehicle ?? null);
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error("[useVehicleDetails] failed", {
          vehicleId,
          message: err?.message,
          status: err?.response?.status,
          data: err?.response?.data,
        });
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch vehicle details",
        );
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [initialVehicle, vehicleId]);

  return { vehicle, loading, error };
}
