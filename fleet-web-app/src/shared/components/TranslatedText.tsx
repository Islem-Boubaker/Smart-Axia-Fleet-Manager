import { type ElementType, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { translateText } from '../services/azureTranslator.service';

interface TranslatedTextProps {
  /** Raw English text from the backend. */
  text: string | null | undefined;
  /** Shown when text is empty/null. Defaults to an em-dash. */
  fallback?: string;
  /** Tailwind / CSS classes applied to the wrapper element. */
  className?: string;
  /** HTML tag to render. Defaults to span. */
  as?: ElementType;
}

/**
 * Key-value pair that tracks which (lang, raw) combination produced a translation.
 * When the key no longer matches the current lang/raw, the component falls back
 * to displaying the original text — no synchronous setState needed.
 */
interface Translation {
  key: string;   // "<lang>:<raw>"
  value: string; // translated text
}

/**
 * Inline translation component for individual dynamic text fields.
 *
 * Renders the original English text immediately, then swaps to the translated
 * version once the Azure Translator API responds. Uses the translation cache
 * so subsequent renders for the same text + language are instant.
 *
 * Use this for single text values in cards, badges, or detail panels.
 * For translating entire arrays (table rows), prefer useTranslatedData instead.
 *
 * Example:
 *   <TranslatedText text={maintenance.description} className="text-sm text-gray-600" />
 */
export function TranslatedText({
  text,
  fallback = '—',
  className,
  as: Tag = 'span',
}: TranslatedTextProps) {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').split('-')[0];

  const raw = text?.trim() || '';
  const translationKey = `${lang}:${raw}`;

  // Holds the last successful translation alongside the key it was computed for.
  // When translationKey changes (lang or text changed), this becomes stale and
  // the component renders the original text until the new translation arrives.
  const [translation, setTranslation] = useState<Translation | null>(null);

  // Prevents stale async callbacks from writing state after a new request starts.
  const requestId = useRef(0);

  useEffect(() => {
    if (!raw || lang === 'en') return;

    const id = ++requestId.current;

    translateText(raw, lang)
      .then((translated) => {
        if (requestId.current === id) {
          // Only async setState — no sync setState in the effect body
          setTranslation({ key: translationKey, value: translated || raw });
        }
      })
      .catch(() => {
        // Fallback: stale/null translation causes the original text to display
      });
  }, [raw, lang, translationKey]);

  // Derive the displayed value without any synchronous state writes:
  // - If we have a translation for the exact current key, show it.
  // - Otherwise show the original English text (or fallback) immediately.
  const display =
    translation?.key === translationKey ? translation.value : raw || fallback;

  return <Tag className={className}>{display}</Tag>;
}
