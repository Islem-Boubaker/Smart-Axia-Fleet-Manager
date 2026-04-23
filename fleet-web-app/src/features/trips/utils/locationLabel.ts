type NominatimAddress = {
  postcode?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  suburb?: string;
  county?: string;
  state?: string;
  state_district?: string;
  province?: string;
  region?: string;
};

const COUNTRY_LABELS = new Set(['tunisia', 'tunisie']);

const cleanPart = (value?: string | null) => String(value ?? '').trim().replace(/\s+/g, ' ');

export const extractPostalCode = (value: string): string | null => {
  const match = value.match(/\b(\d{4,6})\b/);
  return match?.[1] ?? null;
};

export const compactLocationLabel = (locationName: string) => {
  const raw = cleanPart(locationName);
  if (!raw) return '';

  const postalCode = extractPostalCode(raw);
  if (!postalCode) return raw;

  const parts = raw
    .split(',')
    .map(cleanPart)
    .filter(Boolean)
    .filter((part) => !COUNTRY_LABELS.has(part.toLowerCase()));

  const postcodeIndex = parts.findIndex((part) => part.includes(postalCode));
  if (postcodeIndex <= 0) return raw;

  for (let index = postcodeIndex - 1; index >= 0; index -= 1) {
    const candidate = parts[index];
    if (!candidate || candidate.includes(postalCode) || /^\d+$/.test(candidate)) continue;
    return `${candidate}, ${postalCode}`;
  }

  return raw;
};

export const formatLocationFromAddress = (displayName: string, address?: NominatimAddress): string => {
  const postalCode = cleanPart(address?.postcode);
  const cityLike = [
    address?.city,
    address?.town,
    address?.village,
    address?.municipality,
    address?.suburb,
    address?.county,
    address?.state_district,
    address?.state,
    address?.province,
    address?.region,
  ]
    .map(cleanPart)
    .find(Boolean);

  if (cityLike && postalCode) return `${cityLike}, ${postalCode}`;
  if (cityLike) return cityLike;
  if (postalCode) return postalCode;

  return compactLocationLabel(displayName);
};
