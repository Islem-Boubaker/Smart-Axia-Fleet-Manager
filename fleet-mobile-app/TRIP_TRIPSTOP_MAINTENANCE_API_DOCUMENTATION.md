# Smart Axia Fleet Manager API Documentation

## 1. Global Overview
Smart Axia Fleet Manager orchestrates fleet operations through three tightly coupled modules:
- Trip: manages trip scheduling, assignment, execution, and completion.
- TripStop: manages ordered stops nested under a trip lifecycle.
- Maintenance: manages vehicle maintenance scheduling and execution, and blocks vehicle usage when needed.

### Module interaction
- Trip ↔ TripStop:
  - A trip has many stops.
  - Stop operations are constrained by trip status and role ownership.
- Trip ↔ Maintenance:
  - Trip creation/update checks maintenance conflicts.
  - A vehicle under maintenance cannot be assigned to conflicting trips.
- Maintenance ↔ Vehicle availability:
  - Starting maintenance marks vehicle as IN_MAINTENANCE.
  - Completing/cancelling maintenance may return vehicle to AVAILABLE.

## 2. Architecture Decisions
- Nested route design:
  - TripStops are nested under Trips, for example /trips/:id/stops.
- Layered architecture:
  - Routes apply auth/role/csrf/validation.
  - Controllers handle HTTP response mapping.
  - Services enforce business rules, transitions, and side effects.
- Status-driven workflows:
  - Trip and Maintenance transitions are explicitly controlled.
  - Invalid transitions return conflict errors.

## 3. Data Models Overview

### Trip Model
| Field | Type | Required | Description |
|------|------|------|------|
| id | UUID | Yes | Trip primary key |
| userId | UUID | No | Assigned driver user id |
| vehicleId | UUID | Yes | Vehicle id |
| region | string | No | Operational region |
| startLocation | string | Yes | Trip origin |
| endLocation | string | Yes | Trip destination |
| startTime | datetime | Yes | Planned/actual start datetime |
| endTime | datetime | No | Planned/actual end datetime |
| distance | float | Yes | Trip distance |
| fuel | string | No | Fuel metadata |
| cost | float | No | Cost metadata |
| status | enum | Yes | scheduled, ongoing, completed, cancelled |
| createdAt | datetime | Yes | Created timestamp |
| updatedAt | datetime | Yes | Updated timestamp |

Relationships:
- Trip belongs to User as driver via userId.
- Trip belongs to Vehicle via vehicleId.
- Trip has many TripStop as stops via tripId.

### TripStop Model
| Field | Type | Required | Description |
|------|------|------|------|
| id | UUID | Yes | Stop primary key |
| tripId | UUID | Yes | Parent trip id |
| stopOrder | integer | Yes | Ordered sequence in trip |
| locationName | string | Yes | Stop location label |
| latitude | float | No | Latitude |
| longitude | float | No | Longitude |
| status | enum | Yes | pending, reached, skipped |
| arrivalTime | datetime | No | Actual arrival time when reached |
| estimatedArrival | datetime | No | Planned arrival time |
| notes | string | No | Operational notes |
| createdAt | datetime | Yes | Created timestamp |
| updatedAt | datetime | Yes | Updated timestamp |

Relationships:
- TripStop belongs to Trip via tripId.

### Maintenance Model
| Field | Type | Required | Description |
|------|------|------|------|
| id | UUID | Yes | Maintenance primary key |
| vehicleId | UUID | No | Vehicle id (nullable in model) |
| vehiclePlate | string | Yes | Vehicle plate snapshot |
| scheduledDate | datetime | Yes | Scheduled maintenance datetime |
| completedAt | datetime | No | Completion datetime |
| technician | string | Yes | Assigned technician |
| cost | float | Yes | Maintenance cost |
| mileage | integer | No | Vehicle mileage at maintenance |
| priority | enum | Yes | low, medium, high |
| status | enum | Yes | scheduled, in_progress, completed, cancelled |
| type | string | No | Maintenance type |
| description | text | No | Notes/description |
| attachments | jsonb array | Yes | Array of URL strings |
| createdBy | UUID | No | User who created record |
| updatedBy | UUID | No | User who last updated record |
| createdAt | datetime | Yes | Created timestamp |
| updatedAt | datetime | Yes | Updated timestamp |

Relationships:
- Maintenance belongs to Vehicle as vehicle.
- Maintenance belongs to User as creator via createdBy.
- Maintenance belongs to User as updater via updatedBy.

## 4. Lifecycle Flows

### Trip Lifecycle
scheduled -> ongoing -> completed
scheduled -> cancelled
ongoing -> cancelled
completed/cancelled -> no further transition

### Stop Lifecycle
pending -> reached
pending -> skipped
reached/skipped -> immutable for state actions

### Maintenance Lifecycle
scheduled -> in_progress -> completed
scheduled -> cancelled
completed/cancelled -> terminal

## 5. Full API Documentation

### Common request context
- Auth: required for all endpoints in these modules.
- Auth sources:
  - accessToken cookie, or
  - Authorization: Bearer token.
- CSRF behavior:
  - Required on mutating methods when using cookie auth.
  - Skipped when using Bearer auth without auth cookies.

### Common response envelopes
Success:
```json
{
  "success": true,
  "message": "",
  "data": {}
}
```

Service/controller error envelope:
```json
{
  "success": false,
  "message": "",
  "details": {
    "code": "",
    "errors": []
  }
}
```

Validation error envelope (validator middleware):
```json
{
  "success": false,
  "message": "Validation error",
  "errors": ["field: message"],
  "code": "VALIDATION_ERROR"
}
```

---

## Trips

### POST /trips/
### Basic Info
| Field | Value |
|------|------|
| Method | POST |
| URL | /trips/ |
| Auth | Required |
| Roles | ADMIN, MANAGER |
| CSRF | Required |

### Request
Params: none

Query: none

Body:
```json
{
  "vehicleId": "uuid",
  "userId": "uuid",
  "region": "Tunis",
  "startLocation": "Point A",
  "endLocation": "Point B",
  "startTime": "2026-04-15T08:00:00.000Z",
  "endTime": "2026-04-15T10:00:00.000Z",
  "distance": 120.5,
  "fuel": "Diesel",
  "cost": 75,
  "stops": [
    {
      "locationName": "Stop 1",
      "stopOrder": 1,
      "latitude": 36.8,
      "longitude": 10.18,
      "estimatedArrival": "2026-04-15T08:45:00.000Z",
      "notes": "optional"
    }
  ]
}
```

Field Rules:
| Field | Type | Required | Description |
|------|------|------|------|
| vehicleId | UUID | Yes | Must reference existing vehicle |
| userId | UUID | Yes | Must reference existing DRIVER user |
| startTime/endTime | ISO datetime | startTime yes | startTime must be before endTime when provided |
| distance | number > 0 | Yes | Positive distance |
| stops[].stopOrder | integer > 0 | If stops provided | Unique per trip |

### Success Response
Status: 201
```json
{
  "success": true,
  "message": "Trip created",
  "data": {}
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 400 | BAD_REQUEST | Generic service input failure |
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Role denied |
| 404 | NOT_FOUND | Vehicle/driver not found |
| 409 | CONFLICT | Overlapping trip, vehicle unavailable, maintenance conflict |
| 422 | VALIDATION_ERROR | Body schema invalid or datetime logic invalid |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

Example error:
```json
{
  "success": false,
  "message": "Vehicle already has an overlapping trip",
  "details": {
    "code": "CONFLICT",
    "errors": []
  }
}
```

### Business Logic
- Validates vehicle exists and is operational.
- Validates assigned user role is DRIVER.
- Prevents overlapping trips per vehicle and driver.
- Checks maintenance window conflict before creation.
- Creates trip and optional stops in transaction.
- Emits fleet:trip:assigned if userId exists.

### GET /trips/
### Basic Info
| Field | Value |
|------|------|
| Method | GET |
| URL | /trips/ |
| Auth | Required |
| Roles | ADMIN, MANAGER, DRIVER |
| CSRF | Not required |

### Request
Params: none

Query:
| Field | Type | Required | Description |
|------|------|------|------|
| page | number | No | Default 1 |
| limit | number | No | Default 10, max 100 |
| status | string | No | Trip status filter |
| vehicleId | UUID | No | Vehicle filter |
| userId | UUID | No | Driver filter |
| region | string | No | Region filter |
| includeStops | boolean string | No | Include nested stops |

Body: none

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Trips fetched",
  "data": {
    "data": [],
    "meta": {
      "totalItems": 0,
      "totalPages": 0,
      "currentPage": 1,
      "pageSize": 10
    }
  }
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Role denied |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- DRIVER is restricted to own trips only regardless of query userId.
- Optional inclusion/sorting of stops.
- Paged response with data and meta.

### GET /trips/:id
### Basic Info
| Field | Value |
|------|------|
| Method | GET |
| URL | /trips/:id |
| Auth | Required |
| Roles | ADMIN, MANAGER, DRIVER |
| CSRF | Not required |

### Request
Params:
| Field | Type | Required | Description |
|------|------|------|------|
| id | UUID | Yes | Trip id |

Query: none

Body: none

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Trip fetched",
  "data": {}
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Driver not owner |
| 404 | NOT_FOUND | Trip not found |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- Ownership middleware plus service ownership check for DRIVER.
- Returns trip with ordered stops.

### PATCH /trips/:id
### Basic Info
| Field | Value |
|------|------|
| Method | PATCH |
| URL | /trips/:id |
| Auth | Required |
| Roles | ADMIN, MANAGER |
| CSRF | Required |

### Request
Params: id UUID

Query: none

Body:
```json
{
  "startLocation": "Updated",
  "endLocation": "Updated",
  "startTime": "2026-04-15T09:00:00.000Z",
  "endTime": "2026-04-15T11:00:00.000Z",
  "userId": "uuid",
  "vehicleId": "uuid",
  "distance": 130,
  "fuel": "Diesel",
  "cost": 80
}
```

Field Rules:
| Field | Type | Required | Description |
|------|------|------|------|
| status | N/A | Forbidden | Cannot be updated from this endpoint |
| vehicleId/userId/time window | optional | No | Revalidated for overlaps and maintenance conflicts |

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Trip updated",
  "data": {}
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Role denied or CSRF failed |
| 404 | NOT_FOUND | Trip/vehicle/driver not found |
| 409 | CONFLICT | Completed/cancelled trip or overlap conflict |
| 422 | VALIDATION_ERROR | Invalid payload |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- Disallows updates on completed/cancelled trips.
- Reapplies overlap and maintenance checks if critical fields change.

### DELETE /trips/:id
### Basic Info
| Field | Value |
|------|------|
| Method | DELETE |
| URL | /trips/:id |
| Auth | Required |
| Roles | ADMIN, MANAGER |
| CSRF | Required |

### Request
Params: id UUID

Body: none

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Trip deleted",
  "data": null
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Role denied or CSRF failed |
| 404 | NOT_FOUND | Trip not found |
| 409 | CONFLICT | Completed trip cannot be deleted |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- Completed trips are protected from deletion.

### PATCH /trips/:id/status
### Basic Info
| Field | Value |
|------|------|
| Method | PATCH |
| URL | /trips/:id/status |
| Auth | Required |
| Roles | ADMIN, MANAGER |
| CSRF | Required |

### Request
Params: id UUID

Body:
```json
{
  "status": "ongoing"
}
```

Field Rules:
| Field | Type | Required | Description |
|------|------|------|------|
| status | enum | Yes | scheduled, ongoing, completed, cancelled |

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Trip status updated",
  "data": {}
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Role denied or CSRF failed |
| 404 | NOT_FOUND | Trip not found |
| 409 | CONFLICT | Invalid transition |
| 422 | VALIDATION_ERROR | Invalid status body |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- Enforces transition matrix.
- Emits trip started/completed/cancelled events.

### PATCH /trips/:id/start
### Basic Info
| Field | Value |
|------|------|
| Method | PATCH |
| URL | /trips/:id/start |
| Auth | Required |
| Roles | ADMIN, MANAGER, DRIVER |
| CSRF | Required |

### Request
Params: id UUID

Body: optional empty

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Trip started",
  "data": {}
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Driver not owner, role denied, or CSRF failed |
| 404 | NOT_FOUND | Trip not found |
| 409 | CONFLICT | Trip not in scheduled state |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- DRIVER may start only own trip.
- Emits fleet:trip:started.

### PATCH /trips/:id/complete
### Basic Info
| Field | Value |
|------|------|
| Method | PATCH |
| URL | /trips/:id/complete |
| Auth | Required |
| Roles | ADMIN, MANAGER, DRIVER |
| CSRF | Required |

### Request
Params: id UUID

Body:
```json
{
  "endTime": "2026-04-15T11:15:00.000Z",
  "cost": 82,
  "fuel": "Diesel"
}
```

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Trip completed",
  "data": {}
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Driver not owner, role denied, or CSRF failed |
| 404 | NOT_FOUND | Trip not found |
| 409 | CONFLICT | Trip not in ongoing state |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- DRIVER may complete only own trip.
- Applies settlement fields when provided.
- Emits fleet:trip:completed.

### PATCH /trips/:id/cancel
### Basic Info
| Field | Value |
|------|------|
| Method | PATCH |
| URL | /trips/:id/cancel |
| Auth | Required |
| Roles | ADMIN, MANAGER, DRIVER |
| CSRF | Required |

### Request
Params: id UUID

Body: optional empty

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Trip cancelled",
  "data": {}
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Driver not owner, role denied, or CSRF failed |
| 404 | NOT_FOUND | Trip not found |
| 409 | CONFLICT | Trip not in scheduled/ongoing |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- DRIVER may cancel only own trip.
- Emits fleet:trip:cancelled.

### POST /trips/:id/assign-driver
### Basic Info
| Field | Value |
|------|------|
| Method | POST |
| URL | /trips/:id/assign-driver |
| Auth | Required |
| Roles | ADMIN, MANAGER |
| CSRF | Required |

### Request
Params: id UUID

Body:
```json
{
  "userId": "uuid"
}
```

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Driver assigned to trip",
  "data": {}
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Role denied or CSRF failed |
| 404 | NOT_FOUND | Trip or driver not found |
| 409 | CONFLICT | Trip immutable or driver overlapping trip |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- Validates DRIVER role.
- Checks driver overlap against trip window.
- Emits fleet:trip:assigned.

### POST /trips/:id/unassign-driver
### Basic Info
| Field | Value |
|------|------|
| Method | POST |
| URL | /trips/:id/unassign-driver |
| Auth | Required |
| Roles | ADMIN, MANAGER |
| CSRF | Required |

### Request
Params: id UUID

Body: none

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Driver unassigned from trip",
  "data": {}
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Role denied or CSRF failed |
| 404 | NOT_FOUND | Trip not found |
| 409 | CONFLICT | Trip immutable |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- Clears trip userId only for mutable trips.

---

## Trip Stops

### POST /trips/:id/stops
### Basic Info
| Field | Value |
|------|------|
| Method | POST |
| URL | /trips/:id/stops |
| Auth | Required |
| Roles | ADMIN, MANAGER |
| CSRF | Required |

### Request
Params: id UUID (trip id)

Body (single stop or wrapped list):
```json
{
  "stops": [
    {
      "locationName": "Stop A",
      "stopOrder": 1,
      "latitude": 36.8,
      "longitude": 10.18,
      "estimatedArrival": "2026-04-15T09:00:00.000Z",
      "notes": "optional"
    }
  ]
}
```

### Success Response
Status: 201
```json
{
  "success": true,
  "message": "Stop(s) added",
  "data": []
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Role denied or CSRF failed |
| 404 | NOT_FOUND | Trip not found |
| 409 | CONFLICT | Completed/cancelled trip, duplicate stopOrder |
| 422 | VALIDATION_ERROR | Invalid stop schema or empty stops |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- Stops cannot be added on completed/cancelled trips.
- stopOrder must be unique against both input and existing trip stops.

### GET /trips/:id/stops
### Basic Info
| Field | Value |
|------|------|
| Method | GET |
| URL | /trips/:id/stops |
| Auth | Required |
| Roles | ADMIN, MANAGER, DRIVER |
| CSRF | Not required |

### Request
Params: id UUID

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Stops fetched",
  "data": []
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Driver not owner |
| 404 | NOT_FOUND | Trip not found |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- DRIVER can only read own trip stops.
- Returns stops ordered by stopOrder ASC.

### PATCH /trips/:id/stops/:stopId
### Basic Info
| Field | Value |
|------|------|
| Method | PATCH |
| URL | /trips/:id/stops/:stopId |
| Auth | Required |
| Roles | ADMIN, MANAGER |
| CSRF | Required |

### Request
Params: id UUID, stopId UUID

Body:
```json
{
  "locationName": "Updated Stop",
  "stopOrder": 2,
  "latitude": 36.81,
  "longitude": 10.2,
  "estimatedArrival": "2026-04-15T09:15:00.000Z",
  "notes": "updated"
}
```

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Stop updated",
  "data": {}
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Role denied or CSRF failed |
| 404 | NOT_FOUND | Trip or stop not found |
| 409 | CONFLICT | Trip immutable, reached/skipped stop immutable, stopOrder conflict |
| 422 | VALIDATION_ERROR | Invalid body |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- Only allowed fields are mutable.
- Reached/skipped stops cannot be edited.

### DELETE /trips/:id/stops/:stopId
### Basic Info
| Field | Value |
|------|------|
| Method | DELETE |
| URL | /trips/:id/stops/:stopId |
| Auth | Required |
| Roles | ADMIN, MANAGER |
| CSRF | Required |

### Request
Params: id UUID, stopId UUID

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Stop deleted",
  "data": null
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Role denied or CSRF failed |
| 404 | NOT_FOUND | Trip or stop not found |
| 409 | CONFLICT | Trip immutable or reached stop cannot be deleted |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- Reached stops are protected from deletion.

### PATCH /trips/:id/stops/:stopId/reach
### Basic Info
| Field | Value |
|------|------|
| Method | PATCH |
| URL | /trips/:id/stops/:stopId/reach |
| Auth | Required |
| Roles | ADMIN, MANAGER, DRIVER |
| CSRF | Required |

### Request
Params: id UUID, stopId UUID

Body:
```json
{
  "arrivalTime": "2026-04-15T09:20:00.000Z"
}
```

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Stop marked as reached",
  "data": {}
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Driver not owner, role denied, or CSRF failed |
| 404 | NOT_FOUND | Trip or stop not found |
| 409 | CONFLICT | Trip not ongoing, stop not pending |
| 422 | VALIDATION_ERROR | Invalid arrivalTime format |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- Trip must be ongoing.
- Only pending stop can become reached.
- If arrivalTime absent, current datetime is stored.

### PATCH /trips/:id/stops/:stopId/skip
### Basic Info
| Field | Value |
|------|------|
| Method | PATCH |
| URL | /trips/:id/stops/:stopId/skip |
| Auth | Required |
| Roles | ADMIN, MANAGER, DRIVER |
| CSRF | Required |

### Request
Params: id UUID, stopId UUID

Body:
```json
{
  "notes": "Road blocked"
}
```

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Stop skipped",
  "data": {}
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Driver not owner, role denied, or CSRF failed |
| 404 | NOT_FOUND | Trip or stop not found |
| 409 | CONFLICT | Trip not ongoing, stop not pending |
| 422 | VALIDATION_ERROR | Invalid body |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- Trip must be ongoing.
- Only pending stop can become skipped.

### PATCH /trips/:id/stops/reorder
### Basic Info
| Field | Value |
|------|------|
| Method | PATCH |
| URL | /trips/:id/stops/reorder |
| Auth | Required |
| Roles | ADMIN, MANAGER |
| CSRF | Required |

### Request
Params: id UUID

Body:
```json
{
  "order": [
    { "stopId": "uuid", "stopOrder": 1 },
    { "stopId": "uuid", "stopOrder": 2 }
  ]
}
```

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Stops reordered",
  "data": []
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Role denied or CSRF failed |
| 404 | NOT_FOUND | Trip not found |
| 409 | CONFLICT | Trip not scheduled or duplicate stopOrder |
| 422 | VALIDATION_ERROR | Invalid order payload or stop not in trip |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- Reordering only allowed in scheduled state.
- Applies updates in a DB transaction.

---

## Maintenance

### POST /maintenances
### Basic Info
| Field | Value |
|------|------|
| Method | POST |
| URL | /maintenances |
| Auth | Required |
| Roles | ADMIN, MANAGER |
| CSRF | Required |

### Request
Body:
```json
{
  "vehicleId": "uuid",
  "scheduledDate": "2026-04-18T10:00:00.000Z",
  "technician": "Ahmed",
  "cost": 150,
  "mileage": 45000,
  "type": "Oil change",
  "priority": "medium",
  "description": "Routine maintenance",
  "attachments": ["https://example.com/invoice.pdf"]
}
```

Field Rules:
| Field | Type | Required | Description |
|------|------|------|------|
| vehicleId | UUID | Yes | Must exist |
| scheduledDate | ISO datetime | Yes | Must be future date |
| technician | string 2..100 | Yes | Technician name |
| cost | number >= 0 | Yes | Cost value |
| attachments | URL[] | No | URL array |

### Success Response
Status: 201
```json
{
  "success": true,
  "message": "Maintenance record created successfully",
  "data": {}
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Role denied or CSRF failed |
| 404 | NOT_FOUND | Vehicle not found |
| 409 | CONFLICT | Duplicate active maintenance same date |
| 422 | VALIDATION_ERROR | Invalid body or non-future date |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- Forces status to scheduled.
- Stores createdBy and updatedBy from current user.
- Emits maintenance:created.

### GET /maintenances
### Basic Info
| Field | Value |
|------|------|
| Method | GET |
| URL | /maintenances |
| Auth | Required |
| Roles | ADMIN, MANAGER, DRIVER |
| CSRF | Not required |

### Request
Query:
| Field | Type | Required | Description |
|------|------|------|------|
| page | string number | No | Default 1 |
| limit | string number | No | Default 10, max 100 |
| status | enum | No | scheduled, in_progress, completed, cancelled |
| priority | enum | No | low, medium, high |
| vehicleId | UUID | No | Vehicle filter |
| technician | string | No | ILIKE search |
| dateFrom | ISO datetime | No | Scheduled date lower bound |
| dateTo | ISO datetime | No | Scheduled date upper bound |
| sortBy | enum | No | scheduledDate, createdAt, updatedAt, priority, status |
| sortOrder | enum | No | ASC or DESC |

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Maintenances fetched",
  "data": {
    "data": [],
    "meta": {
      "totalItems": 0,
      "totalPages": 0,
      "currentPage": 1,
      "pageSize": 10
    }
  }
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Role denied |
| 422 | VALIDATION_ERROR | Invalid query shape |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- DRIVER sees only records where createdBy equals caller id.
- Includes vehicle relation.

### GET /maintenances/:id
### Basic Info
| Field | Value |
|------|------|
| Method | GET |
| URL | /maintenances/:id |
| Auth | Required |
| Roles | ADMIN, MANAGER, DRIVER |
| CSRF | Not required |

### Request
Params: id UUID

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Maintenance fetched",
  "data": {}
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Driver trying to read non-owned record |
| 404 | NOT_FOUND | Record not found |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- DRIVER ownership enforced via createdBy.

### PATCH /maintenances/:id
### Basic Info
| Field | Value |
|------|------|
| Method | PATCH |
| URL | /maintenances/:id |
| Auth | Required |
| Roles | ADMIN, MANAGER |
| CSRF | Required |

### Request
Params: id UUID

Body:
```json
{
  "scheduledDate": "2026-04-20T10:00:00.000Z",
  "technician": "Ali",
  "cost": 180,
  "mileage": 45500,
  "type": "Brake check",
  "priority": "high",
  "description": "Updated",
  "attachments": ["https://example.com/report.pdf"]
}
```

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Maintenance record updated successfully",
  "data": {}
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Role denied or CSRF failed |
| 404 | NOT_FOUND | Record not found |
| 409 | CONFLICT | Completed/cancelled immutable or schedule conflict |
| 422 | VALIDATION_ERROR | Invalid body or non-future date |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- Blocks updates for completed/cancelled records.
- Silently ignores updates to blocked fields: status, vehicleId, completedAt, createdBy.

### DELETE /maintenances/:id
### Basic Info
| Field | Value |
|------|------|
| Method | DELETE |
| URL | /maintenances/:id |
| Auth | Required |
| Roles | ADMIN |
| CSRF | Required |

### Request
Params: id UUID

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Maintenance record deleted successfully",
  "data": { "id": "uuid" }
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Role denied or CSRF failed |
| 404 | NOT_FOUND | Record not found |
| 409 | CONFLICT | Completed/in_progress cannot be deleted |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- Deletion allowed only for scheduled/cancelled.

### PATCH /maintenances/:id/status
### Basic Info
| Field | Value |
|------|------|
| Method | PATCH |
| URL | /maintenances/:id/status |
| Auth | Required |
| Roles | ADMIN, MANAGER |
| CSRF | Required |

### Request
Params: id UUID

Body:
```json
{
  "status": "in_progress"
}
```

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Maintenance status updated to in_progress",
  "data": {}
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Role denied or CSRF failed |
| 404 | NOT_FOUND | Record not found |
| 409 | CONFLICT | Invalid transition |
| 422 | VALIDATION_ERROR | Invalid status payload |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- Enforces transition matrix.
- Sets completedAt on completed transition.
- Updates vehicle status and emits maintenance events.

### PATCH /maintenances/:id/start
### Basic Info
| Field | Value |
|------|------|
| Method | PATCH |
| URL | /maintenances/:id/start |
| Auth | Required |
| Roles | ADMIN, MANAGER |
| CSRF | Required |

### Request
Params: id UUID

Body: optional empty

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Maintenance started successfully",
  "data": {}
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Role denied or CSRF failed |
| 404 | NOT_FOUND | Record not found |
| 409 | CONFLICT | Only scheduled can start |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- Wrapper over status transition to in_progress.

### PATCH /maintenances/:id/complete
### Basic Info
| Field | Value |
|------|------|
| Method | PATCH |
| URL | /maintenances/:id/complete |
| Auth | Required |
| Roles | ADMIN, MANAGER |
| CSRF | Required |

### Request
Params: id UUID

Body:
```json
{
  "cost": 210,
  "mileage": 46000,
  "description": "Completed successfully",
  "attachments": ["https://example.com/final-report.pdf"]
}
```

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Maintenance completed successfully",
  "data": {}
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Role denied or CSRF failed |
| 404 | NOT_FOUND | Record not found |
| 409 | CONFLICT | Must be in_progress to complete |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- Optional settlement fields applied before completing.
- Completes through transition logic and side effects.

### PATCH /maintenances/:id/cancel
### Basic Info
| Field | Value |
|------|------|
| Method | PATCH |
| URL | /maintenances/:id/cancel |
| Auth | Required |
| Roles | ADMIN, MANAGER |
| CSRF | Required |

### Request
Params: id UUID

Body: optional empty

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Maintenance cancelled successfully",
  "data": {}
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Role denied or CSRF failed |
| 404 | NOT_FOUND | Record not found |
| 409 | CONFLICT | Only scheduled can be cancelled |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- Transition wrapper to cancelled.

### GET /maintenances/upcoming
### Basic Info
| Field | Value |
|------|------|
| Method | GET |
| URL | /maintenances/upcoming |
| Auth | Required |
| Roles | ADMIN, MANAGER, DRIVER |
| CSRF | Not required |

### Request
Query:
| Field | Type | Required | Description |
|------|------|------|------|
| days | string number | No | 1..30, default 7 |
| limit | string number | No | 1..100, default 20 |
| priority | enum | No | low, medium, high |
| vehicleId | UUID | No | Vehicle filter |

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Upcoming maintenances fetched",
  "data": {
    "windowDays": 7,
    "count": 0,
    "items": []
  }
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Role denied |
| 422 | VALIDATION_ERROR | Invalid query |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- Returns scheduled records within now..now+days.

### GET /maintenances/overdue
### Basic Info
| Field | Value |
|------|------|
| Method | GET |
| URL | /maintenances/overdue |
| Auth | Required |
| Roles | ADMIN, MANAGER |
| CSRF | Not required |

### Request
Query:
| Field | Type | Required | Description |
|------|------|------|------|
| page | string number | No | Default 1 |
| limit | string number | No | Default 10 |
| priority | enum | No | low, medium, high |
| vehicleId | UUID | No | Vehicle filter |

### Success Response
Status: 200
```json
{
  "success": true,
  "message": "Overdue maintenances fetched",
  "data": {
    "count": 0,
    "items": [],
    "page": 1,
    "limit": 10
  }
}
```

### Error Responses
| Status | Code | When |
|------|------|------|
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Role denied |
| 422 | VALIDATION_ERROR | Invalid query |
| 500 | INTERNAL_SERVER_ERROR | Unexpected runtime error |

### Business Logic
- Returns scheduled records with scheduledDate < now.
- Adds computed daysOverdue for each row.

## 6. Role and Permission Matrix
| Endpoint | ADMIN | MANAGER | DRIVER |
|------|------|------|------|
| POST /trips/ | Yes | Yes | No |
| GET /trips/ | Yes | Yes | Yes (own trips only by service constraint) |
| GET /trips/:id | Yes | Yes | Yes (own trip only) |
| PATCH /trips/:id | Yes | Yes | No |
| DELETE /trips/:id | Yes | Yes | No |
| PATCH /trips/:id/status | Yes | Yes | No |
| PATCH /trips/:id/start | Yes | Yes | Yes (own trip only) |
| PATCH /trips/:id/complete | Yes | Yes | Yes (own trip only) |
| PATCH /trips/:id/cancel | Yes | Yes | Yes (own trip only) |
| POST /trips/:id/assign-driver | Yes | Yes | No |
| POST /trips/:id/unassign-driver | Yes | Yes | No |
| POST /trips/:id/stops | Yes | Yes | No |
| GET /trips/:id/stops | Yes | Yes | Yes (own trip only) |
| PATCH /trips/:id/stops/:stopId | Yes | Yes | No |
| DELETE /trips/:id/stops/:stopId | Yes | Yes | No |
| PATCH /trips/:id/stops/:stopId/reach | Yes | Yes | Yes (own trip only) |
| PATCH /trips/:id/stops/:stopId/skip | Yes | Yes | Yes (own trip only) |
| PATCH /trips/:id/stops/reorder | Yes | Yes | No |
| POST /maintenances | Yes | Yes | No |
| GET /maintenances | Yes | Yes | Yes (own records only by createdBy) |
| GET /maintenances/:id | Yes | Yes | Yes (own record only by createdBy) |
| PATCH /maintenances/:id | Yes | Yes | No |
| DELETE /maintenances/:id | Yes | No | No |
| PATCH /maintenances/:id/status | Yes | Yes | No |
| PATCH /maintenances/:id/start | Yes | Yes | No |
| PATCH /maintenances/:id/complete | Yes | Yes | No |
| PATCH /maintenances/:id/cancel | Yes | Yes | No |
| GET /maintenances/upcoming | Yes | Yes | Yes |
| GET /maintenances/overdue | Yes | Yes | No |

## 7. Common Error System
- Auth errors:
  - 401 when token missing, expired, or invalid.
- Permission errors:
  - 403 for role restrictions, ownership restrictions, or CSRF failure.
- Validation errors:
  - 422 from validator middleware with code VALIDATION_ERROR and field-level messages.
- Business conflicts:
  - 409 for invalid state transitions, overlap collisions, immutable terminal states.
- Not found:
  - 404 for missing trip/stop/maintenance/vehicle/driver entities.
- Runtime failures:
  - 500 with generic message Internal server error.

## 8. Cross-Module Rules
- Trip creation/update checks maintenance constraints:
  - Vehicle in IN_MAINTENANCE is blocked.
  - Scheduled/in_progress maintenance overlapping trip window is blocked.
- Maintenance status modifies vehicle availability:
  - in_progress -> vehicle becomes IN_MAINTENANCE.
  - completed/cancelled may set vehicle back to AVAILABLE when currently IN_MAINTENANCE.
- Stop operations depend on parent trip state and ownership.
- Status transitions gate what operations are legal.

## 9. Event System
### Fleet events emitted by trip workflows
- fleet:trip:assigned
- fleet:trip:started
- fleet:trip:completed
- fleet:trip:cancelled

### Maintenance events emitted by maintenance workflows
- maintenance:created
- maintenance:started
- maintenance:completed
- maintenance:cancelled

### Notification handlers side effects
- Trip assigned notifies assigned driver.
- Trip started/completed notifies ADMIN and MANAGER users.
- Trip cancelled notifies trip driver plus ADMIN and MANAGER users.
- Maintenance created/started/completed/cancelled notifies ADMIN and MANAGER users.

## 10. Pagination and Filtering

### Trip listing
- Endpoint: GET /trips/
- Pagination:
  - page default 1
  - limit default 10, max 100
- Filters:
  - status, vehicleId, userId, region
  - includeStops boolean string
- Response structure:
  - data array + meta object (totalItems, totalPages, currentPage, pageSize)

### Trip stops listing
- Endpoint: GET /trips/:id/stops
- No explicit pagination in service.
- Ordered by stopOrder ascending.

### Maintenance listing
- Endpoint: GET /maintenances
- Pagination:
  - page default 1
  - limit default 10, max 100
- Filters:
  - status, priority, vehicleId, technician, dateFrom/dateTo, sortBy, sortOrder
- DRIVER restriction:
  - only maintenances where createdBy equals caller id.

### Maintenance upcoming
- Endpoint: GET /maintenances/upcoming
- Query controls:
  - days range 1..30, default 7
  - limit range 1..100, default 20
  - optional priority and vehicleId

### Maintenance overdue
- Endpoint: GET /maintenances/overdue
- Pagination:
  - page and limit from common pagination utility
- Filters:
  - optional priority and vehicleId
- Extra computed field:
  - daysOverdue per maintenance item
