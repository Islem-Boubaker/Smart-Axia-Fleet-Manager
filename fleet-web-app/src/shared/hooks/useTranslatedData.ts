export function useTranslatedData<T>(
  data: T[],
  _fields: (keyof T)[],
  _enabled = true,
): { translatedData: T[]; isTranslating: boolean } {
  return { translatedData: data, isTranslating: false };
}
