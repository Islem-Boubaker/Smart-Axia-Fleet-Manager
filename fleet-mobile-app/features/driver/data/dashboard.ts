// data/dashboard.ts

export const CURRENT_TASK = {
  vehicle: "Mini Van 03",
  timeLeft: "4 Hr 10 Mins left",
  tripId: "T-001",
};

export const UPCOMING_TASK = {
  vehicle: "Mini Van 05",
  timeLeft: "4 Hr 10 Mins left",
  tripId: "T-002",
};

export const RECENT_TRIPS = [
  {
    id: "1",
    vehicle: "Toyota 9382",
    date: "Monday, 6 Sept",
    tripNumber: "1929120",
    routeCode: "233561",
    distance: "293 km",
    duration: "2h 30m",
    status: "completed",
    score: 90,
    timeUrgent: null,
  },
  {
    id: "2",
    vehicle: "Toyota 9382",
    date: null,
    tripNumber: "1929120",
    routeCode: "233561",
    distance: "N/A",
    duration: "N/A",
    status: "pending",
    score: null,
    timeUrgent: "2h 23m left",
  },
  {
    id: "3",
    vehicle: "Toyota 9382",
    date: "Today, 14:00",
    tripNumber: "1929121",
    routeCode: "233562",
    distance: "145 km",
    duration: "1h 15m",
    status: "active",
    score: 62,
    timeUrgent: null,
  },
];