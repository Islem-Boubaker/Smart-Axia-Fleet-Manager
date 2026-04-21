import { getRedisClient, isRedisAvailable } from "../config/connectdb.js";

const CACHE_KEY_PREFIX = process.env.CACHE_KEY_PREFIX || "smartfleet:v1";
const LIST_TTL_SECONDS = Number.parseInt(process.env.CACHE_LIST_TTL_SECONDS || "600", 10);
const SINGLE_TTL_SECONDS = Number.parseInt(process.env.CACHE_SINGLE_TTL_SECONDS || "1800", 10);

const toSafePositiveInt = (value, fallback) =>
  Number.isInteger(value) && value > 0 ? value : fallback;

const listTtlSeconds = toSafePositiveInt(LIST_TTL_SECONDS, 600);
const singleTtlSeconds = toSafePositiveInt(SINGLE_TTL_SECONDS, 1800);

const normalizeQuery = (query = {}) => {
  const params = new URLSearchParams();
  const entries = Object.entries(query).filter(([key]) => key !== "nocache");

  entries.sort(([a], [b]) => a.localeCompare(b));

  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) params.append(key, String(item));
      }
      continue;
    }

    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  }

  return params.toString();
};

const withWildcard = (key) => (key.endsWith("*") ? key : `${key}*`);

const buildCacheKey = ({ model, method, queryString }) => {
  const safeModel = String(model || "resource").trim().toLowerCase();
  const safeMethod = String(method || "index").trim().toLowerCase();
  const safeQuery = queryString || "_";
  return `${CACHE_KEY_PREFIX}:${safeModel}:${safeMethod}:${safeQuery}`;
};

const invalidatePattern = async (pattern) => {
  const client = getRedisClient();
  if (!client?.isOpen || !isRedisAvailable()) return 0;

  try {
    let cursor = "0";
    let deleted = 0;

    do {
      const reply = await client.scan(cursor, {
        MATCH: pattern,
        COUNT: 200,
      });

      cursor = reply?.cursor || "0";
      const keys = reply?.keys || [];

      if (!keys.length) continue;

      // Prefer UNLINK to reduce blocking on large invalidations.
      if (typeof client.unlink === "function") {
        deleted += await client.unlink(keys);
      } else {
        deleted += await client.del(keys);
      }
    } while (cursor !== "0");

    return deleted;
  } catch (error) {
    console.error("[Cache] invalidatePattern failed:", error.message);
    return 0;
  }
};

const cacheMiddleware = (model = "resource", method = "index", options = {}) => {
  const { requireAuth = false } = options;

  return async (req, res, next) => {
    if (req.method !== "GET") return next();
    if (String(req.query?.nocache).toLowerCase() === "true") return next();
    if (requireAuth && !req.user) return next();
    if (!isRedisAvailable()) return next();

    const userId = req.user?.id ? String(req.user.id) : null;

    const mergedQuery = {
      ...req.query,
      ...(req.params?.id ? { id: req.params.id } : {}),
      ...(userId ? { userId } : {}),
    };

    const queryString = normalizeQuery(mergedQuery);
    const cacheKey = buildCacheKey({ model, method, queryString });
    const ttl = req.params?.id ? singleTtlSeconds : listTtlSeconds;
    const client = getRedisClient();

    req.cacheKey = cacheKey;
    req.cacheInvalidate = async (key) => {
      if (!isRedisAvailable()) return 0;
      try {
        return await client.del(key);
      } catch (error) {
        console.error("[Cache] invalidate key failed:", error.message);
        return 0;
      }
    };

    req.cacheSet = async (data) => {
      if (!isRedisAvailable()) return;
      try {
        await client.set(cacheKey, JSON.stringify(data), { EX: ttl });
      } catch (error) {
        console.error("[Cache] set failed:", error.message);
      }
    };

    try {
      const raw = await client.get(cacheKey);
      if (!raw) return next();

      const parsed = JSON.parse(raw);
      return res.status(200).json(parsed);
    } catch (error) {
      console.error("[Cache] get failed:", error.message);
      return next();
    }
  };
};

cacheMiddleware.invalidatePattern = async (pattern) => {
  const withPrefix = pattern.startsWith(`${CACHE_KEY_PREFIX}:`)
    ? pattern
    : `${CACHE_KEY_PREFIX}:${pattern}`;
  const safePattern = withWildcard(withPrefix);
  return invalidatePattern(safePattern);
};

cacheMiddleware.buildCacheKey = buildCacheKey;

export default cacheMiddleware;
