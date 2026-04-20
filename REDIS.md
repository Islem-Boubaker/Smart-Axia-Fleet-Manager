# Redis in Fleet Backend

## What is Redis?
Redis is an in-memory key-value data store.

In this project, Redis is used as a cache layer in front of the database to:
- speed up GET endpoints
- reduce repeated SQL queries
- reduce API response time under load

## Why use Redis here?
Your backend has many list/detail endpoints that are read frequently.
Caching those responses in Redis means:
- first request = DB query + cache write
- next requests = Redis read (faster)

This improves performance and reduces database pressure.

## Current Redis integration in this project

### 1. Redis connection and lifecycle
- File: `config/connectdb.js`
- Responsibilities:
  - create Redis client and client pool
  - connect with retry strategy
  - support local/prod URL via `REDIS_URL`
  - graceful close on shutdown

### 2. Cache middleware
- File: `middlewares/cache.middleware.js`
- Responsibilities:
  - only cache GET requests
  - skip cache when `nocache=true`
  - build cache key in format: `model:method:queryString`
  - include `userId` for auth-specific data
  - use TTL:
    - list/index: 600s
    - single/by id: 1800s
  - expose helpers:
    - `req.cacheKey`
    - `req.cacheSet(data)`
    - `req.cacheInvalidate(key)`
    - `cacheMiddleware.invalidatePattern(pattern)`

### 3. App startup
- File: `app.js`
- Responsibilities:
  - initialize Redis safely on app boot
  - continue app even if Redis fails (log warning only)

### 4. Graceful shutdown
- File: `server.js`
- Responsibilities:
  - close Redis on SIGTERM/SIGINT
  - close DB and sockets cleanly

## How request flow works with cache

### GET endpoint (cache read-through)
1. Request arrives
2. Middleware builds key (ex: `vehicles:index:limit=10&page=1&userId=123`)
3. If key exists in Redis (HIT), return cached JSON immediately
4. If key missing (MISS), controller/service fetches from DB
5. Controller stores response with `req.cacheSet(...)`
6. Response is returned

### POST/PUT/PATCH/DELETE endpoint (cache invalidation)
1. Mutation succeeds
2. Controller invalidates related keys/patterns (list + detail)
3. Next GET will rebuild fresh cache

## Environment variables
Add to `.env`:

```env
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

Examples:
- local without auth: `redis://localhost:6379`
- local with password: `redis://:yourpassword@localhost:6379`
- ACL/prod: `redis://username:password@host:port`
- TLS/prod: `rediss://username:password@host:port`

## Route usage pattern
Apply cache middleware to GET routes, after auth for protected endpoints:

```js
router.get(
  '/vehicle/getvehicles',
  authMiddleware.authenticate,
  authMiddleware.authorizeRoles('ADMIN', 'MANAGER'),
  cacheMiddleware('vehicles', 'index', { requireAuth: true }),
  vehicleController.getAllVehicles
);
```

## Controller usage pattern
For GET:

```js
const data = await service.getAll(query, req.cacheKey);
const payload = { success: true, data };
if (req.cacheSet) await req.cacheSet(payload);
return res.status(200).json(payload);
```

For mutations:

```js
await cacheMiddleware.invalidatePattern('vehicles:index:*');
await cacheMiddleware.invalidatePattern(`vehicles:show:id=${id}*`);
```

## Operational checklist
1. Start Redis
2. Start backend
3. Call one GET endpoint twice
4. Confirm second call is faster (cached)
5. Call update/delete endpoint
6. Confirm next GET returns fresh data (invalidated)

## Notes
- Cache errors must never crash your API.
- Keep key naming consistent across routes/controllers.
- Invalidation must always happen after successful mutations.
