import type { TripStatus } from "../types/trip.types";

// ─── Status visual config ─────────────────────────────────────────
export const STATUS_CONFIG: Record<
  TripStatus,
  {
    label: string;
    accentColor: string;
    badgeBg: string;
    badgeText: string;
    dotColor: string;
    statBg: string;
  }
> = {
  pending: {
    label: "Pending",
    accentColor: "#F59E0B",
    badgeBg: "#FEF3C7",
    badgeText: "#B45309",
    dotColor: "#F59E0B",
    statBg: "#FEF9EE",
  },
  active: {
    label: "Active",
    accentColor: "#3B82F6",
    badgeBg: "#DBEAFE",
    badgeText: "#1D4ED8",
    dotColor: "#3B82F6",
    statBg: "#EFF6FF",
  },
  completed: {
    label: "Completed",
    accentColor: "#10B981",
    badgeBg: "#D1FAE5",
    badgeText: "#065F46",
    dotColor: "#10B981",
    statBg: "#ECFDF5",
  },
};

// ─── Filter chips ─────────────────────────────────────────────────
export type FilterOption = "all" | TripStatus;

export const FILTER_BUTTONS: {
  id: FilterOption;
  label: string;
  dotColor?: string;
}[] = [
  { id: "all",       label: "All"       },
  { id: "pending",   label: "Pending",   dotColor: "#F59E0B" },
  { id: "active",    label: "Active",    dotColor: "#3B82F6" },
  { id: "completed", label: "Completed", dotColor: "#10B981" },
];