# Driver API Integration Mapping

This document maps mobile features to documented backend endpoints available to the DRIVER role.

## Global Security Rules

- Auth header: Authorization: Bearer [token] when available.
- Cookie auth: supported via shared API cookie jar.
- CSRF header: x-csrf-token is included automatically for mutations.
- Envelope: service methods return normalized response data from { success, data }.

---

## Feature: auth

### Used APIs - Auth

- POST /user/login
- POST /user/logout
- POST /user/refresh-token
- GET /user/me

### Service - Auth

- features/auth/services/auth.api.ts

### Hooks - Auth

- features/auth/hooks/useAuth.ts
- features/auth/hooks/useLogin.ts

### Screen Mapping - Auth

- app/(auth)/login.tsx -> useAuthActions.loginWithEmailPassword -> login()
- app/(auth)/forgotPassword.tsx -> useAuthActions.resetPassword (project-specific route usage)

### Data Flow - Auth

Screen -> hook useAuthActions -> auth.api -> backend /user/\*

---

## Feature: driver (dashboard)

### Used APIs - Driver

- GET /trips?limit=100 (for stats aggregation)
- GET /trips?status=ongoing&limit=1 (active assignment)
- GET /trips?status=scheduled&limit=1 (fallback assignment)
- POST /trips/:id/location-pings

### Service - Driver

- features/driver/services/Dashboard.api.ts
- features/driver/services/driver.api.ts (re-export)

### Hooks - Driver

- features/driver/hooks/useDashboard.ts

### Screen Mapping - Driver

- app/(tabs)/home.tsx -> features/driver/screens/DashboardScreen.tsx -> useDashboard

### Data Flow - Driver

Screen -> useDashboard -> driverApi/tripsApi -> backend /trips

---

## Feature: trips

### Used APIs - Trips

- GET /trips
- GET /trips/:id
- PATCH /trips/:id/start
- PATCH /trips/:id/complete
- PATCH /trips/:id/cancel
- GET /trips/:id/stops
- PATCH /trips/:id/stops/:stopId/reach
- PATCH /trips/:id/stops/:stopId/skip
- GET /trips/:id/live-location
- POST /trips/:id/location-pings
- GET /trips/:id/history

### Service - Trips

- features/trips/services/trips.api.ts

### Hooks - Trips

- features/trips/hooks/useTrips.ts
- features/trips/hooks/useTripDetail.ts
- features/trips/hooks/useTripActions.ts

### Screen Mapping - Trips

- app/(tabs)/trips.tsx -> features/trips/screens/TripsScreen.tsx -> tripsApi.getAllTrips
- app/trips/[id].tsx (route shell for detail screen integration)
- app/trips/live.tsx (route shell for active/live flow integration)

### Data Flow - Trips

Screen -> useTrips/useTripDetail/useTripActions -> tripsApi -> backend /trips

---

## Feature: maps

### Used APIs - Maps

- GET /trips/:id/live-location
- GET /trips/:id/stops
- POST /trips/:id/location-pings
- PATCH /trips/:id/stops/:stopId/reach
- PATCH /trips/:id/stops/:stopId/skip

### Service - Maps

- features/maps/services/maps.api.ts

### Hooks - Maps

- features/maps/hooks/useMaps.ts

### Screen Mapping - Maps

- app/maps/index.tsx -> features/maps/screens/MapsScreen.tsx -> useMapScreen

### Data Flow - Maps

Screen -> useMapScreen -> mapsApi/tripsApi -> backend /trips/:id/\*

---

## Feature: notifications

### Used APIs - Notifications

- GET /notifications
- GET /notifications/grouped
- GET /notifications/unread-count
- GET /notifications/:id
- PATCH /notifications/:id/read
- PATCH /notifications/read-all
- PATCH /notifications/:id/archive
- DELETE /notifications/:id

### Service - Notifications

- features/notifications/services/notification.api.ts

### Hooks - Notifications

- features/notifications/hooks/useNotification.ts
- features/notifications/hooks/useRealtimeNotificationToasts.ts

### Screen Mapping - Notifications

- app/notifications/index.tsx -> features/notifications/screens/NotificationsScreen.tsx -> useNotification

### Data Flow - Notifications

Screen -> useNotification -> notificationApi -> backend /notifications

---

## Feature: profile

### Used APIs - Profile

- GET /user/me
- POST /user/logout
- GET /trips?status=ongoing&limit=1 (vehicle fallback)
- GET /trips?status=scheduled&limit=1 (vehicle fallback)

### Service - Profile

- features/profile/services/profile.api.ts

### Hooks - Profile

- features/profile/hooks/useProfile.ts

### Screen Mapping - Profile

- app/(tabs)/profile.tsx -> features/profile/screens/ProfileScreen.tsx

### Data Flow - Profile

Screen -> useProfile/profile components -> profileApi/vehicleApi -> backend /user + /trips

---

## Feature: reclamations

### Used APIs - Reclamations

- GET /my/reclamations
- GET /my/reclamations/:id
- POST /reclamations
- POST /reclamations/vehicle
- PUT /my/reclamations/:id
- DELETE /my/reclamations/:id
- PUT /:id/attachments

### Service - Reclamations

- features/reclamations/services/reclamation.api.ts

### Hooks - Reclamations

- features/reclamations/hooks/useReclamation.ts

### Screen Mapping - Reclamations

- app/(tabs)/reclamations.tsx -> features/reclamations/screens/ReclamationsScreen.tsx
- app/reclamations/create.tsx -> create flow shell
- app/reclamations/[id].tsx -> detail flow shell

### Data Flow - Reclamations

Screen -> useReclamation -> reclamationApi -> backend /my/reclamations + /reclamations

---

## Driver Authorization Boundaries Enforced

- Driver reads own trips only through backend ownership middleware.
- Driver start/complete/cancel trip uses documented role-safe endpoints.
- Driver location pings and stop actions are bound to own trip by backend ownership checks.
- Driver does not call admin-only trip/user/vehicle management endpoints.
