import { type ElementType } from 'react';

interface TranslatedTextProps {
  text: string | null | undefined;
  fallback?: string;
  className?: string;
  as?: ElementType;
}

export function TranslatedText({
  text,
  fallback = '—',
  className,
  as: Tag = 'span',
}: TranslatedTextProps) {
  return <Tag className={className}>{text?.trim() || fallback}</Tag>;
}
