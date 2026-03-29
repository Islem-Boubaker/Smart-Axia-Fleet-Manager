export interface Trip {
  id: string;
  tripNumber: string;
  vehicle: string;
  status: "completed" | "active" | "pending";
  from: string;
  to: string;
  distance: string;
  duration: string;
  date: string;
  score?: number | null;
  lat: number;
  lng: number;
}