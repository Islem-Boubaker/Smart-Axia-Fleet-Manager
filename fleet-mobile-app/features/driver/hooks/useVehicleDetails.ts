import { useEffect, useState } from "react";
import { api } from "@/shared/services/api";

export function useVehicleDetails(vehicleId: string | null) {
  const [vehicle, setVehicle] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleId) {
      setVehicle(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .get(`/vehicle/getvehicle/${vehicleId}`)
      .then((res) => setVehicle(res.data?.data || null))
      .catch((err) => {
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
      .finally(() => setLoading(false));
  }, [vehicleId]);

  return { vehicle, loading, error };
}
