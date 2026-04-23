type LatLng = { latitude: number; longitude: number };
import { formatLocationLabel } from "./locationLabel";

const TUNISIA_LOCATION_FALLBACKS: Record<string, LatLng> = {
  tunis: { latitude: 36.8065, longitude: 10.1815 },
  ariana: { latitude: 36.8625, longitude: 10.1956 },
  manouba: { latitude: 36.8091, longitude: 10.0963 },
  benarous: { latitude: 36.7544, longitude: 10.2181 },
  benarouss: { latitude: 36.7544, longitude: 10.2181 },
  sousse: { latitude: 35.8256, longitude: 10.6084 },
  kairouan: { latitude: 35.6781, longitude: 10.0963 },
  siliana: { latitude: 36.0887, longitude: 9.3708 },
  sfax: { latitude: 34.7398, longitude: 10.76 },
  nabeul: { latitude: 36.4513, longitude: 10.7351 },
  bizerte: { latitude: 37.2744, longitude: 9.8739 },
  gabes: { latitude: 33.8815, longitude: 10.0982 },
  beja: { latitude: 36.7256, longitude: 9.1817 },
  kef: { latitude: 36.1742, longitude: 8.7049 },
  mahdia: { latitude: 35.5047, longitude: 11.0622 },
  monastir: { latitude: 35.7643, longitude: 10.8113 },
  tozeur: { latitude: 33.9197, longitude: 8.1335 },
  medenine: { latitude: 33.3549, longitude: 10.5055 },
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name?: string;
  address?: {
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
  };
};

export function normalizeAddressKey(address: string): string {
  return address
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractPostalCode(address: string): string | null {
  const match = address.match(/\b(\d{4})\b/);
  return match?.[1] ?? null;
}

export function lookupTunisiaFallback(address: string): LatLng | null {
  const normalized = normalizeAddressKey(address);
  if (!normalized) return null;

  const cityCandidate = normalized.split(",")[0]?.trim() ?? normalized;
  const compactCandidate = cityCandidate.replace(/\s+/g, "");

  return TUNISIA_LOCATION_FALLBACKS[cityCandidate] ?? TUNISIA_LOCATION_FALLBACKS[compactCandidate] ?? null;
}

function normalizePostalCode(value: string | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(0, 4) : null;
}

function buildSearchQueries(address: string, postalCode: string | null): string[] {
  const normalized = address.trim();
  if (!normalized) return [];

  const compactLabel = formatLocationLabel(normalized);
  const withoutCountry = normalized.replace(/\bTunisia\b/i, "").replace(/\s*,\s*/g, ", ").trim().replace(/^,|,$/g, "");
  const withCountry = /\bTunisia\b/i.test(normalized) ? normalized : `${withoutCountry}, Tunisia`;

  const queries = new Set<string>();
  if (compactLabel && compactLabel !== normalized) {
    queries.add(/\bTunisia\b/i.test(compactLabel) ? compactLabel : `${compactLabel}, Tunisia`);
  }
  if (postalCode) {
    queries.add(withCountry);
    queries.add(`${withoutCountry}, ${postalCode}, Tunisia`);
    queries.add(`${postalCode}, ${withoutCountry}, Tunisia`);
  }
  queries.add(withCountry);
  queries.add(normalized);

  return [...queries].filter(Boolean);
}

function scoreResult(result: NominatimResult, normalizedAddress: string, postalCode: string | null): number {
  let score = 0;
  const displayName = normalizeAddressKey(result.display_name ?? "");
  const resultPostalCode = normalizePostalCode(result.address?.postcode);

  if (postalCode) {
    if (resultPostalCode === postalCode) {
      score += 100;
    } else if (resultPostalCode) {
      score -= 100;
    }
  }

  if (displayName.includes(normalizedAddress)) score += 25;
  if (normalizedAddress.split(",")[0] && displayName.includes(normalizedAddress.split(",")[0])) score += 10;

  return score;
}

export async function resolveTunisiaAddressToCoord(
  address: string,
  cache: Record<string, LatLng>,
): Promise<LatLng | null> {
  const normalized = address.trim();
  if (!normalized) return null;

  if (cache[normalized]) {
    return cache[normalized];
  }

  const postalCode = extractPostalCode(normalized);
  const normalizedKey = normalizeAddressKey(normalized);
  const queries = buildSearchQueries(normalized, postalCode);

  try {
    for (const query of queries) {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=tn`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "SmartAxiaFleetManager/1.0 (mobile-app)",
          },
        },
      );

      if (!response.ok) continue;

      const results = (await response.json()) as NominatimResult[];
      if (!Array.isArray(results) || results.length === 0) continue;

      const ranked = [...results].sort(
        (a, b) => scoreResult(b, normalizedKey, postalCode) - scoreResult(a, normalizedKey, postalCode),
      );

      const best = ranked[0];
      const bestPostalCode = normalizePostalCode(best.address?.postcode);
      if (postalCode && bestPostalCode && bestPostalCode !== postalCode) {
        continue;
      }

      const latitude = Number.parseFloat(best.lat);
      const longitude = Number.parseFloat(best.lon);
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) continue;

      const coord = { latitude, longitude };
      cache[normalized] = coord;
      return coord;
    }
  } catch {
    // Fall through to deterministic fallback only when no postal code was provided.
  }

  if (!postalCode) {
    const fallback = lookupTunisiaFallback(normalized);
    if (fallback) {
      cache[normalized] = fallback;
      return fallback;
    }
  }

  return null;
}
