import { LangCache } from "@redis-ai/langcache";

const langCacheEnabled =
  String(process.env.ENABLE_SEMANTIC_CACHE || "false").toLowerCase() === "true";

const langCacheConfig = {
  serverURL: process.env.REDIS_LANGCACHE_SERVER_URL,
  cacheId: process.env.REDIS_LANGCACHE_CACHE_ID,
  apiKey: process.env.REDIS_API_KEY,
};

const hasCompleteLangCacheConfig =
  Boolean(langCacheConfig.serverURL) &&
  Boolean(langCacheConfig.cacheId) &&
  Boolean(langCacheConfig.apiKey);

let langCacheClient = null;

const getLangCacheClient = () => {
  if (!langCacheEnabled || !hasCompleteLangCacheConfig) return null;
  if (langCacheClient) return langCacheClient;

  langCacheClient = new LangCache(langCacheConfig);
  return langCacheClient;
};

const parseSimilarityThreshold = () => {
  const parsed = Number.parseFloat(process.env.SEMANTIC_CACHE_SIMILARITY_THRESHOLD || "0.9");
  if (Number.isNaN(parsed)) return 0.9;
  if (parsed < 0) return 0;
  if (parsed > 1) return 1;
  return parsed;
};

const parseSemanticTtlMs = () => {
  const parsed = Number.parseInt(process.env.SEMANTIC_CACHE_TTL_MS || "86400000", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 86400000;
};

export const semanticSearch = async (prompt, options = {}) => {
  const client = getLangCacheClient();
  if (!client || !prompt || typeof prompt !== "string") return null;

  try {
    const result = await client.search({
      prompt,
      similarityThreshold: options.similarityThreshold ?? parseSimilarityThreshold(),
      attributes: options.attributes,
    });

    if (!result?.data?.length) return null;
    return result.data[0] || null;
  } catch (error) {
    console.error("[SemanticCache] search failed:", error.message);
    return null;
  }
};

export const semanticSet = async (prompt, response, options = {}) => {
  const client = getLangCacheClient();
  if (!client || !prompt || typeof prompt !== "string") return null;
  if (typeof response !== "string" || !response.trim()) return null;

  try {
    return await client.set({
      prompt,
      response,
      attributes: options.attributes,
      ttlMillis: options.ttlMillis ?? parseSemanticTtlMs(),
    });
  } catch (error) {
    console.error("[SemanticCache] set failed:", error.message);
    return null;
  }
};

export const semanticInvalidateByAttributes = async (attributes = {}) => {
  const client = getLangCacheClient();
  if (!client || !attributes || !Object.keys(attributes).length) return null;

  try {
    return await client.deleteQuery({ attributes });
  } catch (error) {
    console.error("[SemanticCache] deleteQuery failed:", error.message);
    return null;
  }
};

export const isSemanticCacheEnabled = () => Boolean(getLangCacheClient());
