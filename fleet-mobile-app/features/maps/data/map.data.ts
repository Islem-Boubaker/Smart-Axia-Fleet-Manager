import type { Region } from "react-native-maps";
import type { TripRoute } from "../types/maps.types";

export const MOCK_TRIP: TripRoute = {
  tripId: "T-001",
  vehicle: "Mini Van 03",
  distance: "45.2 km",
  duration: "1h 10m",
  origin: {
    id: "origin",
    label: "Tunis Centre",
    coordinate: { latitude: 36.8065, longitude: 10.1815 },
    reached: true,
  },
  destination: {
    id: "destination",
    label: "Sfax Airport",
    coordinate: { latitude: 34.7178, longitude: 10.6903 },
    reached: false,
  },
  waypoints: [
    {
      id: "wp1",
      label: "Sousse Stop",
      coordinate: { latitude: 35.8245, longitude: 10.6346 },
      reached: true,
    },
    {
      id: "wp2",
      label: "Monastir Rest",
      coordinate: { latitude: 35.7643, longitude: 10.8113 },
      reached: false,
    },
  ],
  polyline: [
    { latitude: 36.8065, longitude: 10.1815 },
    { latitude: 36.4,    longitude: 10.3    },
    { latitude: 36.0,    longitude: 10.45   },
    { latitude: 35.8245, longitude: 10.6346 },
    { latitude: 35.7643, longitude: 10.8113 },
    { latitude: 35.3,    longitude: 10.72   },
    { latitude: 34.9,    longitude: 10.68   },
    { latitude: 34.7178, longitude: 10.6903 },
  ],
};


// // data/map.data.ts
// export const MOCK_TRIP = {
//   vehicle: { name: "Truck-01", plate: "TN-123" },
//   stops: [
//     { id: "1", name: "Mahdia", coordinate: { latitude: 35.5047, longitude: 11.0622 }, completed: true },
//     { id: "2", name: "Sfax",   coordinate: { latitude: 34.7406, longitude: 10.7603 }, completed: false },
//     { id: "3", name: "Kebili", coordinate: { latitude: 33.7046, longitude: 8.9716  }, completed: false },
//   ],
//   routeCoords: [], // will be fetched dynamically
// };