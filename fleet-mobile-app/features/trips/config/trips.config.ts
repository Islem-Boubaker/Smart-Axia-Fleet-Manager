import type { UiTripStatus } from "../types/trip.types";

// ─── Status visual config ─────────────────────────────────────────
export const STATUS_CONFIG: Record<
  UiTripStatus,
  {
    accentColor: string;
    badgeBg: string;
    badgeText: string;
    dotColor: string;
    statBg: string;
  }
> = {
  pending: {
    accentColor: "#F59E0B",
    badgeBg: "#FEF3C7",
    badgeText: "#B45309",
    dotColor: "#F59E0B",
    statBg: "#FEF9EE",
  },
  active: {
    accentColor: "#3B82F6",
    badgeBg: "#DBEAFE",
    badgeText: "#1D4ED8",
    dotColor: "#3B82F6",
    statBg: "#EFF6FF",
  },
  completed: {
    accentColor: "#10B981",
    badgeBg: "#D1FAE5",
    badgeText: "#065F46",
    dotColor: "#10B981",
    statBg: "#ECFDF5",
  },
};

// ─── Filter chips ─────────────────────────────────────────────────
export type FilterOption = "all" | UiTripStatus;

export const FILTER_BUTTONS: {
  id: FilterOption;
  dotColor?: string;
}[] = [
  { id: "all" },
  { id: "pending", dotColor: "#F59E0B" },
  { id: "completed", dotColor: "#10B981" },
];


export const TRIPS_CONFIG = {
  // OSRM (Open Source Routing Machine) - no API key required for public instance
  OSRM_BASE_URL: "https://router.project-osrm.org",
};
