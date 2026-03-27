export interface Stop {
  id: string;
  label: string;
  coordinate: { latitude: number; longitude: number };
  reached: boolean;
}

export interface TripRoute {
  tripId: string;
  vehicle: string;
  distance: string;
  duration: string;
  origin: Stop;
  destination: Stop;
  waypoints: Stop[];
  polyline: { latitude: number; longitude: number }[];
}