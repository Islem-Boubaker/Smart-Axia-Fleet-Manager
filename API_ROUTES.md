# Fleet Backend API Documentation

## 1. Global Overview

This backend is a Node.js + Express API for fleet management. It uses a layered MVC style:

1. Routes define endpoint paths and middleware chains.
2. Controllers handle HTTP concerns (status codes, response format).
3. Services implement business logic and data access.
4. Models define persistence schema (mainly Sequelize/PostgreSQL; maintenance uses a Mongoose model).

Main capabilities:

- Authentication and authorization with JWT (cookie-first, Bearer fallback)
- User management (signup/login/profile/admin CRUD)
- Vehicle management
- Trip lifecycle management (create, assign, start, complete, cancel, location)
- Maintenance management
- Reclamation handling
- Notification center (list, grouped, unread counters, read/archive/delete)

Application-level middleware in `app.js`:

- `cors` with credentials support
- `helmet`
- API rate limiting (`RATE_LIMIT.api`)
- JSON and URL-encoded body parsing
- `cookie-parser`
- Global error handler

Cross-cutting concerns:

- `authenticate` validates JWT and fills `req.user`
- `authorizeRoles` enforces role-based access
- `verifyCsrf` enforces double-submit cookie on state-changing requests when cookie auth is used
- Validation (Zod) is applied in trip and maintenance routes
- Ownership checks are applied on many trip endpoints via `checkOwnership`

## 3. Authentication, Security, and Conventions

### 3.1 Authentication modes

The backend accepts either:

- `accessToken` cookie (preferred)
- `Authorization: Bearer <token>`

`/user/login` sets:

- `accessToken` (httpOnly)
- `refreshToken` (httpOnly, scoped to `/user/refresh-token`)
- `csrf-token` (readable by JS)

### 3.2 CSRF

For non-safe methods (`POST`, `PUT`, `PATCH`, `DELETE`) on CSRF-protected routes:

- Send CSRF cookie (`csrf-token`) and matching header:
  - `x-csrf-token`, or
  - `x-xsrf-token`, or
  - `csrf-token`

If request is Bearer-only (no auth cookies), CSRF check is skipped.

### 3.3 Common response envelopes

Most endpoints use one of these patterns:

Success:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Validation error:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": ["field: reason"],
  "code": "VALIDATION_ERROR"
}
```

Paginated list:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "totalItems": 0,
    "totalPages": 0,
    "currentPage": 1,
    "pageSize": 10
  }
}
```

### 3.4 Pagination convention

Common query params:

- `page` (default `1`, min `1`)
- `limit` (default `10`, min `1`, max `100`)

---

## Module: User

### Base Route

`/user`

### Endpoint: Login

- Method: `POST`
- Route: `/user/login`
- Description: Authenticate user, set auth cookies, and return profile + CSRF token
- Auth: Public
- Rate Limit: `RATE_LIMIT.login`

#### Request Body

| Name | Type | Required | Description |
|------|------|----------|-------------|
| email | string (email) | Yes | User email |
| password | string | Yes | User password |

#### Response Example

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "ADMIN",
      "phone": "+21600000000"
    },
    "csrfToken": "hex-token"
  }
}
```

### Endpoint: Signup

- Method: `POST`
- Route: `/user/signup`
- Description: Create a new user account
- Auth: Public

#### Request Body

Common fields accepted from user model:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Full name |
| email | string (email) | Yes | Unique email |
| password | string | Yes | Plain password (hashed in model hook) |
| role | enum(`ADMIN`,`DRIVER`,`MANAGER`) | No | Defaults to `DRIVER` |
| phone | string | No | Phone number |
| licenseNumber | string | No | Driver license number |
| licenseExpiry | string (date) | No | License expiry date |
| status | enum(`active`,`inactive`,`on-leave`) | No | Driver status |
| assignedVehicle | string | No | Assigned vehicle reference |
| rating | number | No | 0 to 5 |

#### Response Example

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "DRIVER"
  }
}
```

### Endpoint: Refresh Token

- Method: `POST`
- Route: `/user/refresh-token`
- Description: Renew access token from refresh cookie and rotate CSRF token
- Auth: Refresh cookie required

#### Request Body

None

#### Response Example

```json
{
  "success": true,
  "message": "Token refreshed",
  "csrfToken": "hex-token"
}
```

### Endpoint: Logout

- Method: `POST`
- Route: `/user/logout`
- Description: Clear authentication cookies
- Auth: Required
- CSRF: Required

#### Request Body

None

#### Response Example

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Endpoint: Get Current User

- Method: `GET`
- Route: `/user/me`
- Description: Return currently authenticated user profile
- Auth: Required

#### Request Body

None

#### Response Example

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "ADMIN"
  }
}
```

### Endpoint: Create Driver/User (Admin/Manager)

- Method: `POST`
- Route: `/user/createdriver`
- Description: Create a user from privileged context
- Auth: Required
- Roles: `ADMIN`, `MANAGER`
- CSRF: Required

#### Request Body

Same shape as signup.

#### Response Example

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "New Driver",
    "role": "DRIVER"
  }
}
```

### Endpoint: Get All Users

- Method: `GET`
- Route: `/user/getusers`
- Description: Paginated user list
- Auth: Required
- Roles: `ADMIN`
- CSRF middleware is attached on this GET route in code

#### Query Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | integer | No | Page number |
| limit | integer | No | Page size (max 100) |

#### Response Example

```json
{
  "success": true,
  "data": [],
  "meta": {
    "totalItems": 14,
    "totalPages": 2,
    "currentPage": 1,
    "pageSize": 10
  }
}
```

### Endpoint: Get User By ID

- Method: `GET`
- Route: `/user/getuser/:id`
- Description: Fetch one user by UUID
- Auth: Required
- Roles: `ADMIN`, `MANAGER`
- CSRF middleware is attached on this GET route in code

#### Path Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | UUID | Yes | User ID |

#### Response Example

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

### Endpoint: Update User

- Method: `PUT`
- Route: `/user/updateuser/:id`
- Description: Update user fields
- Auth: Required
- Roles: `ADMIN`
- CSRF: Required

#### Path Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | UUID | Yes | User ID |

#### Request Body

Any subset of user fields; empty/blank `password` is ignored by service.

#### Response Example

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Name",
    "email": "updated@example.com"
  }
}
```

### Endpoint: Delete User

- Method: `DELETE`
- Route: `/user/deleteuser/:id`
- Description: Delete a user
- Auth: Required
- Roles: `ADMIN`
- CSRF: Required

#### Path Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | UUID | Yes | User ID |

#### Response Example

HTTP `204 No Content`

---

## Module: Vehicle

### Base Route

`/vehicle`

All vehicle endpoints:

- Auth required
- Roles required: `ADMIN` or `MANAGER`

### Endpoint: Create Vehicle

- Method: `POST`
- Route: `/vehicle/addvehicle`
- Description: Create a vehicle record

#### Request Body

Representative fields from model:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Vehicle name |
| Vehicle_Model | enum(`Car`,`SUV`,`Van`,`Truck`,`Bus`,`Motorcycle`) | Yes | Model class |
| Vehicle_Age | integer | Yes | Vehicle age |
| Maintenance_History | enum(`Good`,`Average`,`Poor`) | Yes | Maintenance quality |
| Tire_Condition | enum(`New`,`Good`,`Worn Out`) | Yes | Tire condition |
| Brake_Condition | enum(`New`,`Good`,`Worn Out`) | Yes | Brake condition |
| Battery_Status | enum(`New`,`Good`,`Weak`) | Yes | Battery state |
| status | enum(`AVAILABLE`,`IN_MAINTENANCE`,`OUT_OF_SERVICE`,`ON_TRIP`) | No | Defaults to `AVAILABLE` |
| vin | string(17) | No | Unique VIN |
| plaque_immatriculation | string | No | Unique plate |

#### Response Example

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Truck 1",
    "status": "AVAILABLE"
  }
}
```

### Endpoint: Get Vehicles

- Method: `GET`
- Route: `/vehicle/getvehicles`
- Description: Paginated vehicle list

#### Query Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | integer | No | Page number |
| limit | integer | No | Page size |

#### Response Example

```json
{
  "success": true,
  "data": [],
  "meta": {
    "totalItems": 30,
    "totalPages": 3,
    "currentPage": 1,
    "pageSize": 10
  }
}
```

### Endpoint: Get Vehicle By ID

- Method: `GET`
- Route: `/vehicle/getvehicle/:id`
- Description: Fetch vehicle by UUID

#### Path Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | UUID | Yes | Vehicle ID |

#### Response Example

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Truck 1"
  }
}
```

### Endpoint: Update Vehicle

- Method: `PUT`
- Route: `/vehicle/updatevehicle/:id`
- Description: Update vehicle fields

#### Path Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | UUID | Yes | Vehicle ID |

#### Request Body

Any updatable vehicle fields.

#### Response Example

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "IN_MAINTENANCE"
  }
}
```

### Endpoint: Delete Vehicle

- Method: `DELETE`
- Route: `/vehicle/deletevehicle/:id`
- Description: Delete vehicle and related reclamations for that vehicle

#### Path Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | UUID | Yes | Vehicle ID |

#### Response Example

```json
{
  "success": true,
  "message": "Vehicle deleted successfully"
}
```

---

## Module: Trip

### Base Route

`/trips`

All trip endpoints are behind `authenticate` middleware.

### Endpoint: Create Trip

- Method: `POST`
- Route: `/trips`
- Description: Create a trip with business and overlap validations
- Roles: `ADMIN`, `MANAGER`
- CSRF: Required

#### Request Body

| Name | Type | Required | Description |
|------|------|----------|-------------|
| vehicleId | UUID | Yes | Vehicle ID |
| userId | UUID | Yes | Driver user ID |
| region | string | Yes | Region name |
| startLocation | string | Yes | Start location |
| endLocation | string | Yes | End location |
| startTime | string (ISO datetime) | Yes | Trip start |
| endTime | string (ISO datetime) | No | Trip end (must be after startTime) |
| distance | number > 0 | Yes | Distance |
| fuel | string | No | Fuel info |
| cost | number >= 0 | No | Cost |
| status | enum | No | Service forces `scheduled` on create |

#### Response Example

```json
{
  "success": true,
  "message": "Trip created",
  "data": {
    "id": "uuid",
    "vehicleId": "uuid",
    "userId": "uuid",
    "status": "scheduled"
  }
}
```

### Endpoint: List Trips

- Method: `GET`
- Route: `/trips`
- Description: Paginated trips with optional filters
- Roles: `ADMIN`, `MANAGER`, `DRIVER`

#### Query Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | integer | No | Page number |
| limit | integer | No | Page size |
| status | string | No | Filter by trip status |
| vehicleId | UUID | No | Filter by vehicle |
| userId | UUID | No | Filter by driver |

For `DRIVER` role, service enforces `userId = req.user.id`.

#### Response Example

```json
{
  "success": true,
  "message": "Trips fetched",
  "data": [],
  "meta": {
    "totalItems": 12,
    "totalPages": 2,
    "currentPage": 1,
    "pageSize": 10
  }
}
```

### Endpoint: Get Trip By ID

- Method: `GET`
- Route: `/trips/:id`
- Description: Get one trip
- Roles: `ADMIN`, `MANAGER`, `DRIVER`
- Ownership: Driver can only access own trips

### Endpoint: Update Trip

- Method: `PATCH`
- Route: `/trips/:id`
- Description: Update trip fields with overlap/time checks
- Roles: `ADMIN`, `MANAGER`
- CSRF: Required
- Ownership middleware attached

#### Request Body

Any subset of create fields.

### Endpoint: Update Trip Status

- Method: `PATCH`
- Route: `/trips/:id/status`
- Description: Explicit status transition endpoint
- Roles: `ADMIN`, `MANAGER`
- CSRF: Required
- Allowed transitions:
  - `scheduled -> ongoing | cancelled`
  - `ongoing -> completed | cancelled`

#### Request Body

| Name | Type | Required | Description |
|------|------|----------|-------------|
| status | enum(`scheduled`,`ongoing`,`completed`,`cancelled`) | Yes | New status |

### Endpoint: Delete Trip

- Method: `DELETE`
- Route: `/trips/:id`
- Description: Delete a trip (completed trips cannot be deleted)
- Roles: `ADMIN`, `MANAGER`
- CSRF: Required

### Endpoint: Assign Driver To Trip

- Method: `POST`
- Route: `/trips/:id/assign-driver`
- Description: Assign driver user to trip
- Roles: `ADMIN`, `MANAGER`
- CSRF: Required

#### Request Body

| Name | Type | Required | Description |
|------|------|----------|-------------|
| userId | UUID | Yes | Driver ID (must have role DRIVER) |

### Endpoint: Unassign Driver From Trip

- Method: `POST`
- Route: `/trips/:id/unassign-driver`
- Description: Remove assigned driver
- Roles: `ADMIN`, `MANAGER`
- CSRF: Required

### Endpoint: Start Trip

- Method: `PATCH`
- Route: `/trips/:id/start`
- Description: Move trip to `ongoing`
- Roles: `DRIVER`, `ADMIN`, `MANAGER`
- CSRF: Required

### Endpoint: Complete Trip

- Method: `PATCH`
- Route: `/trips/:id/complete`
- Description: Move trip to `completed`
- Roles: `DRIVER`, `ADMIN`, `MANAGER`
- CSRF: Required

#### Request Body

Optional completion payload:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| endTime | string (datetime) | No | Completion time |
| cost | number | No | Final cost |
| fuel | string | No | Final fuel usage |

### Endpoint: Cancel Trip

- Method: `PATCH`
- Route: `/trips/:id/cancel`
- Description: Move trip to `cancelled`
- Roles: `DRIVER`, `ADMIN`, `MANAGER`
- CSRF: Required

### Endpoint: Get Live Location

- Method: `GET`
- Route: `/trips/:id/live-location`
- Description: Return live location payload placeholder (only if status is ongoing)
- Roles: `ADMIN`, `MANAGER`, `DRIVER`

### Endpoint: Record Location Ping

- Method: `POST`
- Route: `/trips/:id/location-pings`
- Description: Record location ping payload for ongoing trip
- Roles: `DRIVER`
- CSRF: Required

#### Request Body

| Name | Type | Required | Description |
|------|------|----------|-------------|
| latitude | number | Yes | Latitude |
| longitude | number | Yes | Longitude |
| speed | number | No | Speed |
| recordedAt | string (datetime) | No | Ping timestamp |

### Endpoint: Get Trip History

- Method: `GET`
- Route: `/trips/:id/history`
- Description: Return trip history placeholder
- Roles: `ADMIN`, `MANAGER`, `DRIVER`

#### Generic Success Example (Trip endpoints)

```json
{
  "success": true,
  "message": "Trip updated",
  "data": {
    "id": "uuid",
    "status": "ongoing"
  }
}
```

---

## Module: Maintenance

### Base Route

`/maintenances`

Maintenance router applies globally:

- `authenticate`
- `authorizeRoles('ADMIN','MANAGER')`
- `verifyCsrf` (applies to all maintenance routes, including GET)

### Endpoint: Create Maintenance

- Method: `POST`
- Route: `/maintenances`
- Description: Create maintenance entry

#### Request Body

Validated fields:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| vehiclePlate | string | Yes | Vehicle plate |
| scheduledDate | string (date) | Yes | Scheduled date |
| technician | string | Yes | Assigned technician |
| cost | number >= 0 | Yes | Cost |
| priority | enum(`low`,`medium`,`high`) | No | Priority |
| status | enum(`scheduled`,`in_progress`,`completed`,`cancelled`) | No | Status |

#### Response Example

```json
{
  "success": true,
  "message": "Maintenance created",
  "data": {
    "id": "..."
  }
}
```

### Endpoint: List Maintenances

- Method: `GET`
- Route: `/maintenances`
- Description: Paginated maintenance list

#### Query Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | integer | No | Page number |
| limit | integer | No | Page size |

### Endpoint: Get Maintenance By ID

- Method: `GET`
- Route: `/maintenances/:id`
- Description: Fetch one maintenance by ID

### Endpoint: Update Maintenance

- Method: `PUT`
- Route: `/maintenances/:id`
- Description: Replace/update maintenance with create validator rules

### Endpoint: Delete Maintenance

- Method: `DELETE`
- Route: `/maintenances/:id`
- Description: Delete maintenance record

### Endpoint: Update Maintenance Status

- Method: `PATCH`
- Route: `/maintenances/:id/status`
- Description: Update status only

#### Request Body

| Name | Type | Required | Description |
|------|------|----------|-------------|
| status | string | Yes | New maintenance status |

---

## Module: Notification

### Base Route

`/notifications`

All notification endpoints require authentication.

### Endpoint: Get Notifications

- Method: `GET`
- Route: `/notifications`
- Description: Paginated and filterable notification list

#### Query Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | integer | No | Page number |
| limit | integer | No | Page size (default 20, max 100) |
| group | string | No | Group filter |
| priority | string | No | Priority filter |
| type | string | No | Type filter |
| unread | boolean | No | If true, only unread |
| archived | boolean | No | If true include archived set; false returns non-archived |
| since | datetime string | No | `createdAt >= since` |

#### Response Example

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "notifications": [],
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Endpoint: Get Grouped Notifications

- Method: `GET`
- Route: `/notifications/grouped`
- Description: Notifications grouped by `group`

### Endpoint: Get Unread Count

- Method: `GET`
- Route: `/notifications/unread-count`
- Description: Return unread count for authenticated user

### Endpoint: Mark All As Read

- Method: `PATCH`
- Route: `/notifications/read-all`
- Description: Mark all unread notifications as read (optional by group)

#### Request Body

| Name | Type | Required | Description |
|------|------|----------|-------------|
| group | string | No | Restrict update to one group |

### Endpoint: Get Notification By ID

- Method: `GET`
- Route: `/notifications/:id`
- Description: Fetch single user-owned notification

### Endpoint: Mark Notification As Read

- Method: `PATCH`
- Route: `/notifications/:id/read`
- Description: Mark one notification as read

### Endpoint: Archive Notification

- Method: `PATCH`
- Route: `/notifications/:id/archive`
- Description: Archive one notification

### Endpoint: Delete Notification

- Method: `DELETE`
- Route: `/notifications/:id`
- Description: Delete one notification

### Endpoint: Send Test Notification

- Method: `POST`
- Route: `/notifications/test`
- Description: Create test notification (blocked in production)

#### Request Body

| Name | Type | Required | Description |
|------|------|----------|-------------|
| userId | UUID | No | Defaults to authenticated user |
| type | string | No | Notification type |
| title | string | No | Title |
| message | string | No | Body |
| metadata | object | No | Extra data |

---

## Module: Reclamation

### Base Route

This router is mounted at `/` in `app.js`, so its routes are currently root-level.

### Endpoint: Create Vehicle Reclamation

- Method: `POST`
- Route: `/reclamations/vehicle`
- Description: Submit reclamation for a vehicle
- Auth: Required

#### Request Body

| Name | Type | Required | Description |
|------|------|----------|-------------|
| vehicleId | UUID | Yes | Vehicle ID |
| subject | string | Yes | Subject |
| message | string | Yes | Reclamation details |

#### Response Example

```json
{
  "success": true,
  "message": "Vehicle reclamation submitted successfully",
  "data": {
    "id": "uuid",
    "status": "PENDING"
  }
}
```

### Endpoint: Create General Reclamation

- Method: `POST`
- Route: `/reclamations`
- Description: Create a general reclamation (optionally linked to a vehicle)
- Auth: Required

#### Request Body

| Name | Type | Required | Description |
|------|------|----------|-------------|
| subject | string | Yes | Reclamation title |
| message | string | Yes | Reclamation details |
| vehicleId | UUID | Optional in service, effectively required by model | Related vehicle ID |

#### Response Example

```json
{
  "success": true,
  "message": "Reclamation created successfully",
  "data": {
    "id": "uuid",
    "subject": "Late maintenance",
    "status": "PENDING"
  }
}
```

### Endpoint: Get My Reclamations

- Method: `GET`
- Route: `/my/reclamations`
- Description: List current user reclamations (paginated)
- Auth: Required

#### Query Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | integer | No | Page number |
| limit | integer | No | Page size |

#### Response Example

```json
{
  "success": true,
  "total": 25,
  "page": 1,
  "pages": 3,
  "data": []
}
```

### Endpoint: Get My Reclamation By ID

- Method: `GET`
- Route: `/my/reclamations/:id`
- Description: Return a single reclamation owned by the authenticated user
- Auth: Required

#### Path Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | UUID | Yes | Reclamation ID |

#### Response Example

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "subject": "Engine issue",
    "status": "PENDING"
  }
}
```

### Endpoint: Update My Reclamation

- Method: `PUT`
- Route: `/my/reclamations/:id`
- Description: Update an owned reclamation (allowed only while status is `PENDING`)
- Auth: Required

#### Path Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | UUID | Yes | Reclamation ID |

#### Request Body

| Name | Type | Required | Description |
|------|------|----------|-------------|
| subject | string | No | Updated title |
| message | string | No | Updated details |
| vehicleId | UUID | No | Updated vehicle reference |

#### Response Example

```json
{
  "success": true,
  "message": "Reclamation updated successfully",
  "data": {
    "id": "uuid",
    "subject": "Updated subject"
  }
}
```

### Endpoint: Delete My Reclamation

- Method: `DELETE`
- Route: `/my/reclamations/:id`
- Description: Delete an owned reclamation
- Auth: Required

#### Path Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | UUID | Yes | Reclamation ID |

#### Response Example

```json
{
  "success": true,
  "message": "Reclamation deleted successfully"
}
```

### Endpoint: Get All Reclamations

- Method: `GET`
- Route: `/reclamations`
- Description: List all reclamations (paginated)
- Auth: Required
- Roles: `ADMIN`

#### Query Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | integer | No | Page number |
| limit | integer | No | Page size |

#### Response Example

```json
{
  "success": true,
  "total": 100,
  "page": 1,
  "pages": 10,
  "data": []
}
```

### Endpoint: Get Reclamation By ID (Admin)

- Method: `GET`
- Route: `/reclamations/:id`
- Description: Fetch a reclamation by ID
- Auth: Required
- Roles: `ADMIN`

#### Path Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | UUID | Yes | Reclamation ID |

#### Response Example

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "PENDING",
    "userId": "uuid"
  }
}
```

### Endpoint: Update Reclamation Status

- Method: `PATCH`
- Route: `/reclamations/:id/status`
- Description: Update status of one reclamation
- Auth: Required
- Roles: `ADMIN`

#### Request Body

| Name | Type | Required | Description |
|------|------|----------|-------------|
| status | string | Yes | New status |

#### Response Example

```json
{
  "success": true,
  "message": "Reclamation status updated",
  "data": {
    "id": "uuid",
    "status": "RESOLVED"
  }
}
```

### Endpoint: Delete Reclamation

- Method: `DELETE`
- Route: `/reclamations/:id`
- Description: Delete one reclamation
- Auth: Required
- Roles: `ADMIN`

#### Path Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | UUID | Yes | Reclamation ID |

#### Response Example

```json
{
  "success": true,
  "message": "Reclamation deleted successfully"
}
```

### Endpoint: Filter Reclamations By Status

- Method: `GET`
- Route: `/reclamations/status/:status`
- Description: Return all reclamations matching a status
- Auth: Required
- Roles: `ADMIN`

#### Path Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| status | string | Yes | Status filter (for example `PENDING`, `RESOLVED`, `REJECTED`) |

#### Response Example

```json
{
  "success": true,
  "data": []
}
```

### Endpoint: Search Reclamations

- Method: `GET`
- Route: `/reclamations/search`
- Description: Advanced search with keyword and optional filters
- Auth: Required
- Roles: `ADMIN`

#### Query Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| keyword | string | No | Search in subject and message |
| status | string | No | Filter by status |
| userId | UUID | No | Filter by owner |
| vehicleId | UUID | No | Filter by vehicle |
| startDate | date | No | Start creation date |
| endDate | date | No | End creation date |
| page | integer | No | Page number |
| limit | integer | No | Page size |

#### Response Example

```json
{
  "success": true,
  "total": 7,
  "page": 1,
  "pages": 1,
  "data": []
}
```

### Endpoint: Upload Reclamation Attachment

- Method: `POST`
- Route: `/reclamations/:id/upload`
- Description: Upload and attach a file path to a reclamation (expects middleware like multer to populate `req.file`)
- Auth: Required
- Roles: Any authenticated user (no admin-only guard in route)

#### Path Params

| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | UUID | Yes | Reclamation ID |

#### Body

`multipart/form-data` with one file field handled by upload middleware.

#### Response Example

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": "uuid"
  }
}
```

---

## 4. Common Error Cases by Middleware

### Authentication errors

- `401` no token: `Authentication required — no token provided`
- `401` expired token: `Access token expired`
- `401` invalid token: `Invalid access token`

### Authorization errors

- `403` role mismatch: `Access denied: insufficient permissions`

### CSRF errors

- `403` `CSRF token validation failed`

### Validation errors

- `422` with `code: VALIDATION_ERROR` for Zod validation failures

### Global error handler examples

- `400` Sequelize validation error
- `409` duplicate unique field
- `409` foreign-key conflict
- `500` internal server error fallback

---

## 5. Notes and Implementation Observations



3. CSRF is attached on some `GET` routes (for example user and maintenance modules). `verifyCsrf` currently skips safe methods, so this does not block reads.
4. Trip creation validator allows nullable `endTime`, while service enforces valid `startTime` and `endTime` for create path; callers should provide both to avoid service-level errors.
