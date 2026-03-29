import * as Device from "expo-device";

const DEFAULT_BASE_URL = "http://localhost:3000";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

function isLocalhostUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return LOCAL_HOSTS.has(parsed.hostname);
  } catch {
    return LOCAL_HOSTS.has(value);
  }
}

function normalizeCandidates(rawValue?: string): string[] {
  if (!rawValue) return [];
  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function resolveApiBaseUrl(rawValue?: string): string {
  const candidates = normalizeCandidates(rawValue);
  if (candidates.length === 0) return DEFAULT_BASE_URL;

  const indexRaw = process.env.EXPO_PUBLIC_API_URL_INDEX;
  const index = indexRaw ? Number(indexRaw) : Number.NaN;
  if (!Number.isNaN(index) && candidates[index]) {
    return candidates[index];
  }

  const isDevice = Boolean(Device.isDevice);

  if (isDevice) {
    const nonLocal = candidates.find((item) => !isLocalhostUrl(item));
    if (nonLocal) return nonLocal;
  } else {
    const local = candidates.find((item) => isLocalhostUrl(item));
    if (local) return local;
  }

  return candidates[0];
}
