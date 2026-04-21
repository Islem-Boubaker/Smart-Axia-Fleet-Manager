# Redis in Fleet Backend (Production Guide)

## Overview
This backend uses two cache layers:

1. Standard Redis cache-aside for API responses.
2. Semantic cache (LangCache) for AI prompt/response reuse.

Both layers are fail-safe. If Redis or LangCache fails, the app still serves fresh data from source systems.

## Implementation files
- `fleet-backend/config/connectdb.js`
  Redis connection, pooling, retries, startup, and graceful shutdown.
- `fleet-backend/middlewares/cache.middleware.js`
  Cache-aside middleware with TTL, key strategy, and safe invalidation.
- `fleet-backend/services/semanticCache.service.js`
  LangCache wrapper for semantic search/set/deleteQuery with graceful fallback.
- `fleet-backend/services/vehicle.service.js`
  AI maintenance flow using semantic cache before calling the model.

## Environment variables
Set these in `fleet-backend/.env`:

```env
# Core Redis
REDIS_URL=redis://localhost:6379

# API cache controls
CACHE_KEY_PREFIX=smartfleet:v1
CACHE_LIST_TTL_SECONDS=600
CACHE_SINGLE_TTL_SECONDS=1800

# Semantic cache (LangCache)
ENABLE_SEMANTIC_CACHE=true
REDIS_LANGCACHE_SERVER_URL=https://aws-us-east-1.langcache.redis.io
REDIS_LANGCACHE_CACHE_ID=your_cache_id
REDIS_API_KEY=your_langcache_api_key
SEMANTIC_CACHE_SIMILARITY_THRESHOLD=0.9
SEMANTIC_CACHE_TTL_MS=86400000
```

## Cache-aside pattern in this app

### Read flow (GET)
1. Build cache key from prefix + resource + method + normalized query.
2. Try Redis read first.
3. On hit: return cached response.
4. On miss: fetch from DB/service.
5. Save payload to Redis with TTL.
6. Return fresh payload.

### Write flow (POST/PUT/PATCH/DELETE)
1. Execute mutation in DB.
2. Invalidate related keys/patterns.
3. Next read repopulates cache.

## Cache key naming strategy
Format:

```text
{CACHE_KEY_PREFIX}:{model}:{method}:{normalizedQuery}
```

Examples:
- `smartfleet:v1:vehicles:index:limit=10&page=1&userId=12`
- `smartfleet:v1:vehicles:show:id=42&userId=12`

Why this strategy:
- Namespaced by version (`v1`) for safe rollout.
- Model/method segmentation for precise invalidation.
- Query normalization prevents duplicate keys for same params.

## TTL strategy
- List endpoints: `CACHE_LIST_TTL_SECONDS` (default 600s).
- Detail endpoints: `CACHE_SINGLE_TTL_SECONDS` (default 1800s).
- Semantic entries: `SEMANTIC_CACHE_TTL_MS` (default 24h).

## Graceful error handling
- Redis connection issues do not crash app startup.
- Cache get/set/invalidate failures log and continue.
- LangCache failures automatically fall back to live AI generation.

## Invalidation examples

Invalidate all vehicle list variations:

```js
await cacheMiddleware.invalidatePattern('vehicles:index:*');
```

Invalidate one vehicle detail family:

```js
await cacheMiddleware.invalidatePattern(`vehicles:show:id=${id}*`);
```

Invalidate semantic entries by metadata attributes:

```js
await semanticInvalidateByAttributes({
  feature: 'maintenance-recommendation',
  vehicleId: String(id),
});
```

## Semantic caching behavior (AI app)
For maintenance recommendations:
1. Build prompt from vehicle context.
2. Search semantic cache with threshold + attributes.
3. On hit, parse cached response and persist.
4. On miss, call Gemini, parse result, save DB, then `set` semantic cache.

## How to run
From `fleet-backend`:

```bash
npm install
npm run dev
```

## How to test quickly
1. Call `GET /vehicle/getvehicles` twice. Second call should be faster.
2. Update a vehicle (`PUT /vehicle/updatevehicle/:id`).
3. Call `GET /vehicle/getvehicle/:id` and verify fresh value.
4. Trigger maintenance AI twice for similar prompts and verify second call reuses semantic cache.

## Deploy notes
1. Use managed Redis with TLS (`rediss://`) in production.
2. Set secure env vars in your host (never hardcode secrets).
3. Keep cache prefix versioned to support safe cache migrations.
4. Monitor cache hit ratio and Redis latency.
5. Rotate `REDIS_API_KEY` if it was ever exposed.
