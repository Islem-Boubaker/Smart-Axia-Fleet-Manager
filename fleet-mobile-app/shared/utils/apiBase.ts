import Constants from "expo-constants";
import * as Device from "expo-device";

export const DEPLOYED_API_BASE_URL =
  "https://smart-axia-fleet-manager-server-ayfdfkdjb4g9cfbx.spaincentral-01.azurewebsites.net";

const DEFAULT_BASE_URL = DEPLOYED_API_BASE_URL;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
const PRIVATE_IPV4_PATTERNS = [
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
];

type ExpoConfigShape = {
  expoGoConfig?: { debuggerHost?: string };
  manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
  expoConfig?: { hostUri?: string };
};

function isLocalhostUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return LOCAL_HOSTS.has(parsed.hostname);
  } catch {
    return LOCAL_HOSTS.has(value);
  }
}

function isPrivateIpv4Host(hostname: string): boolean {
  return PRIVATE_IPV4_PATTERNS.some((pattern) => pattern.test(hostname));
}

function isLocalNetworkUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return LOCAL_HOSTS.has(parsed.hostname) || isPrivateIpv4Host(parsed.hostname);
  } catch {
    return LOCAL_HOSTS.has(value) || isPrivateIpv4Host(value);
  }
}

function extractExpoHostCandidate(rawHost?: string, port = 3000): string | null {
  if (!rawHost) return null;

  const host = rawHost.split(",")[0]?.trim().split(":")[0]?.trim();
  if (!host) return null;

  return `http://${host}:${port}`;
}

function getExpoDerivedBaseUrl(port = 3000): string | null {
  const constants = Constants as unknown as ExpoConfigShape;

  const expoHost =
    constants.expoGoConfig?.debuggerHost ??
    constants.manifest2?.extra?.expoGo?.debuggerHost ??
    constants.expoConfig?.hostUri;

  return extractExpoHostCandidate(expoHost, port);
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
  const firstCandidate = candidates[0];
  const resolvedPort = (() => {
    try {
      if (!firstCandidate) return 3000;
      const parsed = new URL(firstCandidate);
      return Number(parsed.port || 3000);
    } catch {
      return 3000;
    }
  })();
  const expoDerivedBaseUrl = getExpoDerivedBaseUrl(resolvedPort);

  if (expoDerivedBaseUrl) {
    const shouldPreferExpoHost =
      candidates.length === 0 ||
      candidates.some((item) => isLocalNetworkUrl(item));

    if (shouldPreferExpoHost) {
      return expoDerivedBaseUrl;
    }
  }

  if (candidates.length === 0) return DEFAULT_BASE_URL;

  const indexRaw = process.env.EXPO_PUBLIC_API_URL_INDEX;
  const index = indexRaw ? Number(indexRaw) : Number.NaN;
  if (!Number.isNaN(index) && candidates[index]) {
    return candidates[index];
  }

  const isDevice = Boolean(Device.isDevice);

  if (isDevice) {
    const nonLocal = candidates.find((item) => !isLocalNetworkUrl(item));
    if (nonLocal) return nonLocal;
  } else {
    const local = candidates.find((item) => isLocalhostUrl(item));
    if (local) return local;
  }

  return candidates[0];
}
