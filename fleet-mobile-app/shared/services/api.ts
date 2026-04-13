import { tokenStorage } from "@/features/auth/services/tokenStorage";
import axios from "axios";
import { resolveApiBaseUrl } from "../utils/apiBase";
import { buildCookieHeader, syncCookiesFromServer } from "./cookieJar";
import { getCsrfToken } from "./csrf";

const apiUrl = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);

if (!apiUrl) {
  console.warn(
    "⚠️ WARNING: EXPO_PUBLIC_API_URL not configured! Using localhost fallback.",
  );
}

console.log("🔧 Initializing API with baseURL:", apiUrl);

export const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const headers = config.headers ?? {};
  const cookie = await buildCookieHeader();
  if (cookie) headers["Cookie"] = cookie;

  const bearerToken = await tokenStorage.getAccessToken();
  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  }

  const csrfToken = getCsrfToken();
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  config.headers = headers;
  return config;
});

api.interceptors.response.use(async (response) => {
  const setCookieHeader = response.headers["set-cookie"];
  if (setCookieHeader) {
    const cookies = parseCookiesFromHeader(setCookieHeader);
    await syncCookiesFromServer(cookies);
  }
  return response;
});

function parseCookiesFromHeader(
  setCookieHeader: string | string[],
): Record<string, string> {
  const cookies: Record<string, string> = {};
  const headers = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];

  for (const header of headers) {
    const [cookiePair] = header.split(";");
    const separatorIndex = cookiePair.indexOf("=");
    if (separatorIndex <= 0) continue;

    const name = cookiePair.slice(0, separatorIndex).trim();
    const value = cookiePair.slice(separatorIndex + 1).trim();
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  }

  return cookies;
}
