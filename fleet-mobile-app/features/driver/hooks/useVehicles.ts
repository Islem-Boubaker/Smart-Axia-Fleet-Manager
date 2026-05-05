import { useEffect, useState } from "react";
import { api } from "@/shared/services/api";

const normalizeVehicleStatus = (value: unknown) => {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const normalized = value.trim().toUpperCase().replace(/[-\s]+/g, "_");
  if (normalized === "AVAILABLE") return "AVAILABLE";
  if (normalized === "ON_TRIP" || normalized === "IN_USE") return "ON_TRIP";
  if (normalized === "IN_MAINTENANCE" || normalized === "MAINTENANCE") return "IN_MAINTENANCE";
  if (normalized === "OUT_OF_SERVICE" || normalized === "INACTIVE") return "OUT_OF_SERVICE";
  return null;
};

const statusLabel = (status: string) => {
  if (status === "ON_TRIP") return "In Use";
  if (status === "IN_MAINTENANCE") return "Maintenance";
  if (status === "OUT_OF_SERVICE") return "Inactive";
  return "Available";
};

const normalizeVehicle = (vehicle: any) => {
  const status = normalizeVehicleStatus(vehicle?.status) ?? "AVAILABLE";
  return {
    ...vehicle,
    status,
    statusLabel: statusLabel(status),
    Active: status !== "OUT_OF_SERVICE",
    Need_Maintenance: status === "IN_MAINTENANCE",
  };
};

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
        setVehicles((list || []).map(normalizeVehicle));
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
