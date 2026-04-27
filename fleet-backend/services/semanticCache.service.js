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

const MAX_PROMPT_LENGTH = 1024;

const normalizePrompt = (prompt) => {
  if (typeof prompt !== 'string') return '';
  const trimmed = prompt.trim();
  if (!trimmed) return '';
  return trimmed.length <= MAX_PROMPT_LENGTH ? trimmed : trimmed.slice(0, MAX_PROMPT_LENGTH);
};

let attributesSupported = true;

export const semanticSearch = async (prompt, options = {}) => {
  const client = getLangCacheClient();
  const safePrompt = normalizePrompt(prompt);
  if (!client || !safePrompt) return null;

  const performSearch = async (useAttributes) => {
    const searchConfig = {
      prompt: safePrompt,
      similarityThreshold: options.similarityThreshold ?? parseSimilarityThreshold(),
    };
    if (useAttributes && options.attributes && Object.keys(options.attributes).length > 0) {
      searchConfig.attributes = options.attributes;
    }
    return await client.search(searchConfig);
  };

  try {
    const result = await performSearch(attributesSupported);
    if (!result?.data?.length) return null;
    return result.data[0] || null;
  } catch (error) {
    if (String(error?.message || '').toLowerCase().includes('no attributes are configured')) {
      attributesSupported = false; // Disable attributes globally to save future roundtrips
      try {
        const retryResult = await performSearch(false);
        if (!retryResult?.data?.length) return null;
        return retryResult.data[0] || null;
      } catch (retryError) {
        console.error("[SemanticCache] search retry failed:", retryError.message);
        return null;
      }
    }
    console.error("[SemanticCache] search failed:", error.message);
    return null;
  }
};

export const semanticSet = async (prompt, response, options = {}) => {
  const client = getLangCacheClient();
  const safePrompt = normalizePrompt(prompt);
  if (!client || !safePrompt) return null;
  if (typeof response !== "string" || !response.trim()) return null;

  const performSet = async (useAttributes) => {
    const setConfig = {
      prompt: safePrompt,
      response,
      ttlMillis: options.ttlMillis ?? parseSemanticTtlMs(),
    };
    if (useAttributes && options.attributes && Object.keys(options.attributes).length > 0) {
      setConfig.attributes = options.attributes;
    }
    return await client.set(setConfig);
  };

  try {
    return await performSet(attributesSupported);
  } catch (error) {
    if (String(error?.message || '').toLowerCase().includes('no attributes are configured')) {
      attributesSupported = false; // Disable global support flag
      try {
        return await performSet(false);
      } catch (retryError) {
        console.error("[SemanticCache] set retry failed:", retryError.message);
        return null;
      }
    }
    console.error("[SemanticCache] set failed:", error.message);
    return null;
  }
};

export const semanticInvalidateByAttributes = async (attributes = {}) => {
  if (!attributesSupported) return null; // Early bailout if server lacks support
  const client = getLangCacheClient();
  if (!client || !attributes || !Object.keys(attributes).length) return null;

  try {
    return await client.deleteQuery({ attributes });
  } catch (error) {
    if (String(error?.message || '').toLowerCase().includes('no attributes are configured')) {
      attributesSupported = false; // Disable global flag
      return null;
    }
    console.error("[SemanticCache] deleteQuery failed:", error.message);
    return null;
  }
};

export const isSemanticCacheEnabled = () => Boolean(getLangCacheClient());
