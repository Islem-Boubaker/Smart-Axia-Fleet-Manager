import { useEffect, useState } from "react";
import { api } from "@/shared/services/api";

export function useVehicles() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVehicles() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/vehicle/getvehicles");
        // Backend returns a paging envelope: { data: { data: Vehicle[] } } or { data: Vehicle[] }
        const payload = res.data?.data ?? res.data;
        // When the server returns a paging structure, extract the inner `data` array
        const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
        setVehicles(list || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch vehicles");
      } finally {
        setLoading(false);
      }
    }
    fetchVehicles();
  }, []);

  return { vehicles, loading, error };
}
