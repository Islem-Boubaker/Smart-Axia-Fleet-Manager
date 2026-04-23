# Fleet Backend API Documentation

## 1. Global Overview

This backend is an Express.js API for fleet operations (users, vehicles, trips, maintenance, reclamations, notifications) built with an MVC layering:

1. Routes define endpoint paths and middleware chains.
2. Controllers handle HTTP responses and call services.
3. Services implement business logic and persistence calls.
4. Models define data schemas (mostly Sequelize/PostgreSQL).

Main features:

- Cookie/Bearer JWT authentication and role-based authorization
- CSRF protection for state-changing endpoints when cookie auth is used
- Vehicle lifecycle and driver assignment
- Trip lifecycle management with business validation
- Maintenance management
- Reclamation management with Cloudinary image uploads
- Notification center (list/read/archive/delete/grouping/unread count)
- Global security middleware (cors, helmet, rate limiting, error handling)

Global middleware in app:

- cors with credentials options
- helmet
- API rate limiter
- JSON and URL-encoded parsers
- cookie-parser
- centralized error handler

Mounting:

- All routers are mounted at root `/`
- Effective paths are exactly the route strings shown below

## 2. Authentication, Security, and Conventions

### 2.1 Authentication

Accepted auth modes:

- accessToken cookie (preferred)
- Authorization: Bearer token

Login sets:

- accessToken (httpOnly)
- refreshToken (httpOnly, scoped to refresh route)
- csrf-token cookie

### 2.2 CSRF

For protected mutation routes, include one of:

- x-csrf-token
- x-xsrf-token
- csrf-token

When request uses bearer-only mode without auth cookies, CSRF middleware may skip checks depending on middleware logic.

### 2.3 Common Success Envelope

```json
{
  "success": true,
  "data": {}
}
```

### 2.4 Common Error Envelope

```json
{
  "success": false,
  "message": "Error message"
}
```

---

# Module: User

## Base Route

`/user`

---

## Endpoint: Login

- Method: POST
- Route: `/user/login`
- Description: Authenticate user and set auth cookies
- Auth: Public
- Rate limit: login policy

### Request Body

| Name | Type | Required | Description |
|------|------|----------|-------------|
| email | string | Yes | User email |
| password | string | Yes | User password |

### Response Example

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Jane",
      "email": "jane@example.com",
      "role": "ADMIN"
    },
    "csrfToken": "token"
  }
}
```

## Endpoint: Refresh Token

- Method: POST
- Route: `/user/refresh-token`
- Description: Rotate access token from refresh token cookie
- Auth: Refresh token cookie required

### Request Body

None

## Endpoint: Logout

- Method: POST
- Route: `/user/logout`
- Description: Clear auth cookies
- Auth: Required
- CSRF: Required

### Request Body

None

## Endpoint: Get Current User

- Method: GET
- Route: `/user/me`
- Description: Fetch authenticated profile
- Auth: Required

### Request Body

None

## Endpoint: Create Driver/User

- Method: POST
- Route: `/user/createdriver`
- Description: Create user from admin/manager context
- Auth: Required
- Roles: ADMIN, MANAGER
- CSRF: Required
- Content-Type: application/json or multipart/form-data (avatar optional)

### Request Body

| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Full name |
| email | string | Yes | Email |
| password | string | Yes | Password |
| role | enum | No | ADMIN, DRIVER, MANAGER |
| avatar | file | No | Avatar image |

## Endpoint: Get All Users

- Method: GET
- Route: `/user/getusers`
- Description: List users (paginated)
- Auth: Required
- Roles: ADMIN

### Query Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | number | No | Page number |
| limit | number | No | Page size |

## Endpoint: Get User By ID

- Method: GET
- Route: `/user/getuser/:id`
- Description: Get one user by id
- Auth: Required
- Roles: ADMIN, MANAGER

## Endpoint: Update User

- Method: PUT
- Route: `/user/updateuser/:id`
- Description: Update user fields
- Auth: Required
- Roles: ADMIN
- CSRF: Required

## Endpoint: Delete User

- Method: DELETE
- Route: `/user/deleteuser/:id`
- Description: Delete user
- Auth: Required
- Roles: ADMIN
- CSRF: Required

## Endpoint: Update User Avatar (Preferred)

- Method: PATCH
- Route: `/user/:id/avatar`
- Description: Upload/update avatar in Cloudinary
- Auth: Required
- CSRF: Required
- Content-Type: multipart/form-data

### Request Body

| Name | Type | Required | Description |
|------|------|----------|-------------|
| avatar | file | Yes | Avatar image |

## Endpoint: Update User Photo (Backward Compatible)

- Method: PUT
- Route: `/user/:id/photo`
- Description: Backward-compatible avatar update route
- Auth: Required
- CSRF: Required
- Content-Type: multipart/form-data

---

# Module: Vehicle

## Base Route

`/vehicle`

All vehicle endpoints require auth and ADMIN or MANAGER role.

---

## Endpoint: Create Vehicle

- Method: POST
- Route: `/vehicle/addvehicle`
- Description: Create vehicle, supports Cloudinary image upload
- Auth: Required
- Roles: ADMIN, MANAGER
- Content-Type: application/json or multipart/form-data

### Request Body

| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Vehicle name |
| Vehicle_Model | enum | Yes | Car, SUV, Van, Truck, Bus, Motorcycle |
| Vehicle_Age | number | Yes | Vehicle age |
| photos | file[] | No | Up to 5 files |

## Endpoint: Get Vehicles

- Method: GET
- Route: `/vehicle/getvehicles`
- Description: Paginated vehicle list
- Auth: Required
- Roles: ADMIN, MANAGER

## Endpoint: Get Vehicle By ID

- Method: GET
- Route: `/vehicle/getvehicle/:id`
- Description: Get one vehicle
- Auth: Required
- Roles: ADMIN, MANAGER

## Endpoint: Update Vehicle

- Method: PUT
- Route: `/vehicle/updatevehicle/:id`
- Description: Update vehicle, supports photo replacement/upload
- Auth: Required
- Roles: ADMIN, MANAGER
- Content-Type: application/json or multipart/form-data

## Endpoint: Delete Vehicle

- Method: DELETE
- Route: `/vehicle/deletevehicle/:id`
- Description: Delete vehicle
- Auth: Required
- Roles: ADMIN, MANAGER

## Endpoint: Assign Driver

- Method: PATCH
- Route: `/vehicle/:id/assign-driver`
- Description: Assign driver and optional trip to vehicle
- Auth: Required
- Roles: ADMIN, MANAGER

### Request Body

| Name | Type | Required | Description |
|------|------|----------|-------------|
| driverId | UUID | Yes | Driver user id |
| tripId | UUID | No | Trip id |

## Endpoint: Unassign Driver

- Method: PATCH
- Route: `/vehicle/:id/unassign-driver`
- Description: Remove driver assignment
- Auth: Required
- Roles: ADMIN, MANAGER

## Endpoint: Check Idle Vehicles

- Method: POST
- Route: `/vehicle/check-idle`
- Description: Run idle vehicle check
- Auth: Required
- Roles: ADMIN, MANAGER

### Request Body

| Name | Type | Required | Description |
|------|------|----------|-------------|
| thresholdMinutes | number | No | Idle threshold, default 30 |

---

# Module: Trip

## Base Route

`/trips`

Router-level auth is enabled for all trip routes.

---

## Endpoint: Create Trip

- Method: POST
- Route: `/trips`
- Description: Create trip with validation chain
- Auth: Required
- Roles: ADMIN, MANAGER
- CSRF: Required

## Endpoint: List Trips

- Method: GET
- Route: `/trips`
- Description: List trips with filters and pagination
- Auth: Required
- Roles: ADMIN, MANAGER, DRIVER

### Query Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | number | No | Page number |
| limit | number | No | Page size |
| status | string | No | Status filter |
| vehicleId | UUID | No | Filter by vehicle |
| userId | UUID | No | Filter by user |

## Endpoint: Get Trip By ID

- Method: GET
- Route: `/trips/:id`
- Description: Get one trip
- Auth: Required
- Roles: ADMIN, MANAGER, DRIVER
- Ownership middleware: Applied

## Endpoint: Update Trip

- Method: PATCH
- Route: `/trips/:id`
- Description: Update trip fields
- Auth: Required
- Roles: ADMIN, MANAGER
- CSRF: Required
- Ownership middleware: Applied

## Endpoint: Update Trip Status

- Method: PATCH
- Route: `/trips/:id/status`
- Description: Update status with transition validation
- Auth: Required
- Roles: ADMIN, MANAGER
- CSRF: Required
- Ownership middleware: Applied

## Endpoint: Delete Trip

- Method: DELETE
- Route: `/trips/:id`
- Description: Delete trip
- Auth: Required
- Roles: ADMIN, MANAGER
- CSRF: Required
- Ownership middleware: Applied

## Endpoint: Assign Driver To Trip

- Method: POST
- Route: `/trips/:id/assign-driver`
- Description: Assign a driver
- Auth: Required
- Roles: ADMIN, MANAGER
- CSRF: Required

## Endpoint: Unassign Driver From Trip

- Method: POST
- Route: `/trips/:id/unassign-driver`
- Description: Remove assigned driver
- Auth: Required
- Roles: ADMIN, MANAGER
- CSRF: Required

## Endpoint: Start Trip

- Method: PATCH
- Route: `/trips/:id/start`
- Description: Start trip
- Auth: Required
- Roles: DRIVER, ADMIN, MANAGER
- CSRF: Required
- Ownership middleware: Applied

## Endpoint: Complete Trip

- Method: PATCH
- Route: `/trips/:id/complete`
- Description: Complete trip
- Auth: Required
- Roles: DRIVER, ADMIN, MANAGER
- CSRF: Required
- Ownership middleware: Applied

## Endpoint: Cancel Trip

- Method: PATCH
- Route: `/trips/:id/cancel`
- Description: Cancel trip
- Auth: Required
- Roles: DRIVER, ADMIN, MANAGER
- CSRF: Required
- Ownership middleware: Applied

## Endpoint: Get Live Location

- Method: GET
- Route: `/trips/:id/live-location`
- Description: Get current location payload for ongoing trip
- Auth: Required
- Roles: ADMIN, MANAGER, DRIVER
- Ownership middleware: Applied

## Endpoint: Record Location Ping

- Method: POST
- Route: `/trips/:id/location-pings`
- Description: Record location ping
- Auth: Required
- Roles: DRIVER
- CSRF: Required
- Ownership middleware: Applied

## Endpoint: Get Trip History

- Method: GET
- Route: `/trips/:id/history`
- Description: Get trip history payload
- Auth: Required
- Roles: ADMIN, MANAGER, DRIVER
- Ownership middleware: Applied

---

# Module: Maintenance

## Base Route

`/maintenances`

Router-level middleware applies to all maintenance routes:

- authenticate
- authorizeRoles(ADMIN, MANAGER)
- verifyCsrf

---

## Endpoint: Create Maintenance

- Method: POST
- Route: `/maintenances`
- Description: Create maintenance record
- Auth: Required
- Roles: ADMIN, MANAGER
- CSRF: Required

## Endpoint: List Maintenances

- Method: GET
- Route: `/maintenances`
- Description: List maintenances
- Auth: Required
- Roles: ADMIN, MANAGER

## Endpoint: Get Maintenance By ID

- Method: GET
- Route: `/maintenances/:id`
- Description: Get one maintenance
- Auth: Required
- Roles: ADMIN, MANAGER

## Endpoint: Update Maintenance

- Method: PUT
- Route: `/maintenances/:id`
- Description: Update maintenance
- Auth: Required
- Roles: ADMIN, MANAGER
- CSRF: Required

## Endpoint: Delete Maintenance

- Method: DELETE
- Route: `/maintenances/:id`
- Description: Delete maintenance
- Auth: Required
- Roles: ADMIN, MANAGER
- CSRF: Required

## Endpoint: Update Maintenance Status

- Method: PATCH
- Route: `/maintenances/:id/status`
- Description: Update maintenance status only
- Auth: Required
- Roles: ADMIN, MANAGER
- CSRF: Required

---

# Module: Notification

## Base Route

`/notifications`

Router-level auth applies to all notification routes.

---

## Endpoint: Get Notifications

- Method: GET
- Route: `/notifications`
- Description: List notifications with pagination/filter options
- Auth: Required

## Endpoint: Get Grouped Notifications

- Method: GET
- Route: `/notifications/grouped`
- Description: Group notifications by group key
- Auth: Required

## Endpoint: Get Unread Count

- Method: GET
- Route: `/notifications/unread-count`
- Description: Get unread counter for current user
- Auth: Required

## Endpoint: Mark All As Read

- Method: PATCH
- Route: `/notifications/read-all`
- Description: Mark all notifications as read (optional group filter)
- Auth: Required

## Endpoint: Get Notification By ID

- Method: GET
- Route: `/notifications/:id`
- Description: Get one notification
- Auth: Required

## Endpoint: Mark Notification As Read

- Method: PATCH
- Route: `/notifications/:id/read`
- Description: Mark one notification as read
- Auth: Required

## Endpoint: Archive Notification

- Method: PATCH
- Route: `/notifications/:id/archive`
- Description: Archive one notification
- Auth: Required

## Endpoint: Delete Notification

- Method: DELETE
- Route: `/notifications/:id`
- Description: Delete one notification
- Auth: Required

## Endpoint: Send Test Notification

- Method: POST
- Route: `/notifications/test`
- Description: Create test notification (typically non-production)
- Auth: Required

---

# Module: Reclamation

## Base Route

Routes are mounted at root `/`.

---

## Endpoint: Create Vehicle Reclamation

- Method: POST
- Route: `/reclamations/vehicle`
- Description: Create reclamation linked to a vehicle with optional images upload
- Auth: Required
- Content-Type: multipart/form-data

### Request Body

| Name | Type | Required | Description |
|------|------|----------|-------------|
| vehicleId | UUID | Yes | Vehicle id |
| subject | string | Yes | Subject |
| message | string | Yes | Message |
| images | file[] | No | Up to 5 images |

## Endpoint: Create General Reclamation

- Method: POST
- Route: `/reclamations`
- Description: Create a general reclamation
- Auth: Required

## Endpoint: Get My Reclamations

- Method: GET
- Route: `/my/reclamations`
- Description: List reclamations for authenticated user
- Auth: Required

## Endpoint: Get My Reclamation By ID

- Method: GET
- Route: `/my/reclamations/:id`
- Description: Get one owned reclamation
- Auth: Required

## Endpoint: Update My Reclamation

- Method: PUT
- Route: `/my/reclamations/:id`
- Description: Update owned reclamation
- Auth: Required

## Endpoint: Delete My Reclamation

- Method: DELETE
- Route: `/my/reclamations/:id`
- Description: Delete owned reclamation
- Auth: Required

## Endpoint: Get All Reclamations

- Method: GET
- Route: `/reclamations`
- Description: Admin list of reclamations
- Auth: Required
- Roles: ADMIN

## Endpoint: Get Reclamation By ID

- Method: GET
- Route: `/reclamations/:id`
- Description: Admin get one reclamation
- Auth: Required
- Roles: ADMIN

## Endpoint: Update Reclamation Status

- Method: PATCH
- Route: `/reclamations/:id/status`
- Description: Admin update status
- Auth: Required
- Roles: ADMIN

## Endpoint: Delete Reclamation

- Method: DELETE
- Route: `/reclamations/:id`
- Description: Admin delete reclamation
- Auth: Required
- Roles: ADMIN

## Endpoint: Filter Reclamations By Status

- Method: GET
- Route: `/reclamations/status/:status`
- Description: Admin status filter
- Auth: Required
- Roles: ADMIN

## Endpoint: Search Reclamations

- Method: GET
- Route: `/reclamations/search`
- Description: Admin search by keyword and filters
- Auth: Required
- Roles: ADMIN

## Endpoint: Upload Reclamation Attachments (Preferred)

- Method: PUT
- Route: `/:id/attachments`
- Description: Upload and append images to reclamation
- Auth: Required
- Content-Type: multipart/form-data

### Request Body

| Name | Type | Required | Description |
|------|------|----------|-------------|
| images | file[] | Yes | Up to 5 images |

## Endpoint: Upload Reclamation Attachments (Backward Compatible)

- Method: POST
- Route: `/reclamations/:id/upload`
- Description: Backward-compatible attachment upload route
- Auth: Required
- Content-Type: multipart/form-data

---

## 3. Validation and Middleware Notes

- Trip routes apply comprehensive validation middleware for create/update/status flows.
- Maintenance routes use dedicated maintenance validator on create and update.
- Global error middleware maps common ORM and server errors to structured responses.
- Upload middleware uses Cloudinary storage (no local disk persistence).

## 4. Pagination Convention

Common query parameters across listing endpoints:

| Name | Type | Default | Notes |
|------|------|---------|-------|
| page | number | 1 | Minimum 1 |
| limit | number | 10 | Module-specific max may apply |
