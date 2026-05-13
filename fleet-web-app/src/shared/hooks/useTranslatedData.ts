import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { translateArrayFields } from '../services/azureTranslator.service';

interface CachedTranslation<T> {
  /** lang + item-IDs — identifies exactly which data was translated */
  key: string;
  data: T[];
}

/**
 * Translates dynamic text fields in an array of objects when the active
 * language is not English.
 *
 * Design:
 *  - Uses a content-based key (lang + item IDs) instead of object reference
 *    equality.  This means the effect is stable even when the caller's hook
 *    returns a new array instance on every render (e.g. after a .sort() spread).
 *  - Zero async calls when lang === 'en'.
 *  - Shows raw English data immediately; swaps to translated data once the
 *    Azure call resolves.
 *  - Falls back to raw English on any API error.
 *  - No synchronous setState inside the effect body.
 *
 * @param data   - Array from the backend (always English).
 * @param fields - Keys whose string values should be translated.
 * @param enabled - Pass false to skip translation (e.g. inside edit forms).
 */
export function useTranslatedData<T>(
  data: T[],
  fields: (keyof T)[],
  enabled = true,
): { translatedData: T[]; isTranslating: boolean } {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').split('-')[0];

  // Always read the latest fields without making them a reactive dep
  const fieldsRef = useRef<(keyof T)[]>(fields);
  fieldsRef.current = fields;

  // Content-based key: stable as long as item IDs and lang don't change.
  // Prevents re-translations when the caller re-creates the array on every render.
  const dataKey =
    lang +
    ':' +
    data.length +
    ':' +
    data.map((item) => String((item as Record<string, unknown>).id ?? '')).join(',');

  // Ref mirrors the latest cached translation so the effect can read it
  // without adding it as a dependency (avoids running after every setState).
  const cacheRef = useRef<CachedTranslation<T> | null>(null);
  const [translation, setTranslation] = useState<CachedTranslation<T> | null>(null);

  useEffect(() => {
    // Nothing to do for English or empty data
    if (!enabled || lang === 'en' || !data.length) return;

    // Already have a translation for this exact content + language
    if (cacheRef.current?.key === dataKey) return;

    let cancelled = false;

    translateArrayFields(data, fieldsRef.current, lang)
      .then((translated) => {
        if (!cancelled) {
          const result: CachedTranslation<T> = { key: dataKey, data: translated };
          cacheRef.current = result;
          setTranslation(result); // only async setState — no sync setState in effect body
        }
      })
      .catch(() => {
        // Fallback: translatedData falls back to raw data automatically (no setState needed)
      });

    return () => {
      cancelled = true;
    };
    // dataKey encodes lang + content, so this is the only dep we need
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, enabled]);

  // Derive display data without any setState: if the cached translation matches
  // the current content+lang key, show it; otherwise show the raw English data.
  const translatedData = translation?.key === dataKey ? translation.data : data;
  const isTranslating =
    enabled && lang !== 'en' && data.length > 0 && translation?.key !== dataKey;

  return { translatedData, isTranslating };
}
