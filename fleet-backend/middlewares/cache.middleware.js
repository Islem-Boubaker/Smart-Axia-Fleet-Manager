import { getRedisClient, isRedisAvailable } from "../config/connectdb.js";

const LIST_TTL_SECONDS = 600;
const SINGLE_TTL_SECONDS = 1800;

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

const invalidatePattern = async (pattern) => {
  const client = getRedisClient();
  if (!client?.isOpen || !isRedisAvailable()) return 0;

  try {
    const keys = await client.keys(pattern);
    if (!keys.length) return 0;
    return await client.del(keys);
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
    const cacheKey = `${model}:${method}:${queryString}`;
    const ttl = req.params?.id ? SINGLE_TTL_SECONDS : LIST_TTL_SECONDS;
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
  const safePattern = withWildcard(pattern);
  return invalidatePattern(safePattern);
};

export default cacheMiddleware;
