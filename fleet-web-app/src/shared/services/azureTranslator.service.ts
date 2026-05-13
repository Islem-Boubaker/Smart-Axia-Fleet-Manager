/**
 * Azure AI Translator — frontend-only translation service.
 *
 * Architecture rule: backend always returns English. This service translates
 * dynamic text fields (notes, descriptions, subjects, messages) client-side.
 * Static UI strings use i18next; this service handles dynamic backend data only.
 */
import axios from 'axios';

const ENDPOINT = (import.meta.env.VITE_AZURE_TRANSLATOR_ENDPOINT as string) || '';
const KEY = (import.meta.env.VITE_AZURE_TRANSLATOR_KEY as string) || '';
const REGION = (import.meta.env.VITE_AZURE_TRANSLATOR_REGION as string) || '';
const API_VERSION = '3.0';
const MAX_BATCH_SIZE = 100;

// ── In-memory cache ──────────────────────────────────────────────────────────
// Key format: "<lang>\x00<originalText>"  →  translatedText
const translationCache = new Map<string, string>();

function makeCacheKey(text: string, lang: string): string {
  return `${lang}\x00${text}`;
}

// ── Azure REST types ─────────────────────────────────────────────────────────
interface AzureTranslateItem {
  translations: Array<{ text: string; to: string }>;
}

// ── Core API call (never call directly — use translateTexts) ─────────────────
// Matches the official Azure AI Translator quickstart pattern exactly.
async function callAzureApi(texts: string[], targetLang: string): Promise<string[]> {
  if (!ENDPOINT || !KEY || !REGION) {
    if (import.meta.env.DEV) {
      console.warn('[AzureTranslator] Missing env vars — falling back to original text.');
    }
    return texts;
  }

  const { data } = await axios<AzureTranslateItem[]>({
    baseURL: ENDPOINT,
    url: '/translate',
    method: 'post',
    headers: {
      'Ocp-Apim-Subscription-Key': KEY,
      'Ocp-Apim-Subscription-Region': REGION,
      'Content-type': 'application/json',
      'X-ClientTraceId': crypto.randomUUID(),
    },
    params: {
      'api-version': API_VERSION,
      from: 'en',
      to: targetLang,   // string, not array — axios encodes ['fr'] as to[]=fr which Azure rejects
    },
    data: texts.map((t) => ({ text: t })),
    responseType: 'json',
    timeout: 10_000,
  });

  return data.map((item, i) => item.translations[0]?.text ?? texts[i]);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Translate an array of strings to targetLang.
 * - Skips empty strings and English.
 * - Deduplicates texts before sending to the API.
 * - Writes results to the in-memory cache.
 * - Splits large arrays into batches of MAX_BATCH_SIZE.
 * - Falls back to the original text on any error.
 */
export async function translateTexts(texts: string[], targetLang: string): Promise<string[]> {
  if (!texts.length || targetLang === 'en') return texts;

  const results: string[] = new Array(texts.length);
  const toFetch: Array<{ originalIndex: number; text: string }> = [];

  // Populate from cache where possible
  texts.forEach((text, i) => {
    if (!text || !text.trim()) {
      results[i] = text;
      return;
    }
    const cached = translationCache.get(makeCacheKey(text, targetLang));
    if (cached !== undefined) {
      results[i] = cached;
    } else {
      toFetch.push({ originalIndex: i, text });
    }
  });

  if (!toFetch.length) return results;

  // Deduplicate — only fetch each unique string once
  const unique = [...new Set(toFetch.map((x) => x.text))];
  const fetchedMap = new Map<string, string>();

  // Batch into chunks of MAX_BATCH_SIZE
  for (let offset = 0; offset < unique.length; offset += MAX_BATCH_SIZE) {
    const chunk = unique.slice(offset, offset + MAX_BATCH_SIZE);
    try {
      const translated = await callAzureApi(chunk, targetLang);
      chunk.forEach((text, idx) => {
        const result = translated[idx] ?? text;
        fetchedMap.set(text, result);
        translationCache.set(makeCacheKey(text, targetLang), result);
      });
    } catch (err) {
      // Graceful degradation: keep originals for this chunk
      if (import.meta.env.DEV) {
        console.error('[AzureTranslator] API error, using original text:', err);
      }
      chunk.forEach((text) => fetchedMap.set(text, text));
    }
  }

  // Merge fetch results back into the output array
  toFetch.forEach(({ originalIndex, text }) => {
    results[originalIndex] = fetchedMap.get(text) ?? text;
  });

  return results;
}

/**
 * Translate a single string. Convenience wrapper around translateTexts.
 */
export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text || targetLang === 'en') return text;
  const [result] = await translateTexts([text], targetLang);
  return result ?? text;
}

/**
 * Return a shallow copy of `obj` with the specified fields translated.
 * Fields with null/undefined values are left unchanged.
 */
export async function translateObjectFields<T>(
  obj: T,
  fields: (keyof T)[],
  targetLang: string,
): Promise<T> {
  if (targetLang === 'en' || !fields.length) return obj;

  const asRecord = obj as Record<string, unknown>;
  const texts = fields.map((f) => String(asRecord[f as string] ?? ''));
  const translated = await translateTexts(texts, targetLang);

  const result = { ...asRecord };
  fields.forEach((f, i) => {
    if (asRecord[f as string] != null) {
      result[f as string] = translated[i];
    }
  });
  return result as T;
}

/**
 * Return a new array where each item is a shallow copy with the specified
 * fields translated.
 *
 * Performance: all translatable strings across the entire array are collected,
 * deduplicated, and sent in a single batched request.
 */
export async function translateArrayFields<T>(
  arr: T[],
  fields: (keyof T)[],
  targetLang: string,
): Promise<T[]> {
  if (!arr.length || targetLang === 'en' || !fields.length) return arr;

  // Collect every field value from every item into one flat list
  const allTexts: string[] = [];
  arr.forEach((item) => {
    const rec = item as Record<string, unknown>;
    fields.forEach((f) => allTexts.push(String(rec[f as string] ?? '')));
  });

  const translated = await translateTexts(allTexts, targetLang);

  return arr.map((item, itemIdx) => {
    const rec = item as Record<string, unknown>;
    const copy = { ...rec };
    fields.forEach((f, fieldIdx) => {
      const globalIdx = itemIdx * fields.length + fieldIdx;
      if (rec[f as string] != null) {
        copy[f as string] = translated[globalIdx];
      }
    });
    return copy as T;
  });
}

/** Expose cache for testing / debugging. */
export const __translationCache = translationCache;
