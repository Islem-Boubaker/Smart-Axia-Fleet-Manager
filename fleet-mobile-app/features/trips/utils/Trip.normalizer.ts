import type { Trip, TripApiResponse } from "../types/trip.types";

// ─── Status mapping ───────────────────────────────────────────────────────────
const mapStatus = (apiStatus: TripApiResponse["status"]): Trip["status"] => {
  switch (apiStatus) {
    case "ongoing":   return "active";
    case "completed": return "completed";
    case "scheduled":
    case "cancelled":
    default:          return "pending";
  }
};

// ─── Duration helper ──────────────────────────────────────────────────────────
const computeDuration = (start: string, end: string | null): string => {
  if (!end) return "In progress";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0) return "—";
  const totalMins = Math.round(ms / 60_000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// ─── Date formatter ───────────────────────────────────────────────────────────
const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }); // e.g. "29 Mar 2026"
  } catch {
    return iso;
  }
};

// ─── Short ID for display ─────────────────────────────────────────────────────
const shortId = (id: string) => id.slice(-6).toUpperCase(); // e.g. "169A8"

// ─── Main normalizer ──────────────────────────────────────────────────────────
export const normalizeTrip = (raw: TripApiResponse): Trip => ({
  id:         raw.id,
  tripNumber: `#${shortId(raw.id)}`,
  from:       raw.startLocation,
  to:         raw.endLocation,
  lat:        0,   // no coords from this endpoint
  lng:        0,
  date:       formatDate(raw.startTime),
  duration:   computeDuration(raw.startTime, raw.endTime),
  vehicle:    raw.vehicleId.slice(-6).toUpperCase(), // until vehicle lookup is wired up
  distance:   `${raw.distance} km`,
  score:      null,
  status:     mapStatus(raw.status),
  _raw:       raw,
});

export const normalizeTrips = (items: unknown): Trip[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => normalizeTrip(item as TripApiResponse));
};