import { tokenStorage } from "@/features/auth/services/tokenStorage";
import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from "axios";
import { resolveApiBaseUrl } from "../utils/apiBase";
import { buildCookieHeader, clearCookies, syncCookiesFromServer } from "./cookieJar";
import { clearCsrfToken, getCsrfToken, saveCsrfToken } from "./csrf";

const apiUrl = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);

if (!apiUrl) {
  console.warn(
    "⚠️ WARNING: EXPO_PUBLIC_API_URL not configured! Using deployed API fallback.",
  );
}

console.log("🔧 Initializing API with baseURL:", apiUrl);

export const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  timeout: 10000,
});

const refreshClient = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  timeout: 10000,
});

type QueuedRequest = {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
};

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

const shouldAttachCsrfHeader = (method?: string): boolean => {
  if (!method) return false;
  const normalized = method.toUpperCase();
  return !["GET", "HEAD", "OPTIONS"].includes(normalized);
};

const updateCsrfFromPayload = async (payload: unknown): Promise<void> => {
  if (!payload || typeof payload !== "object") return;

  const data = payload as { csrfToken?: string; data?: { csrfToken?: string } };
  const csrfToken = data?.data?.csrfToken ?? data?.csrfToken;

  if (csrfToken) {
    await saveCsrfToken(csrfToken);
  }
};

const splitSetCookieHeader = (setCookieHeader: string | string[]): string[] => {
  if (Array.isArray(setCookieHeader)) return setCookieHeader;
  return setCookieHeader.split(/,(?=\s*[^;,\s]+=)/g);
};

const getCookieValue = (cookieHeader: string, name: string): string | null => {
  if (!cookieHeader) return null;

  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey || rawKey !== name) continue;
    const value = rest.join("=").trim();
    return value || null;
  }

  return null;
};

const applyRequestAuth = async (
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> => {
  const headers =
    config.headers instanceof AxiosHeaders
      ? config.headers
      : new AxiosHeaders(config.headers);

  const cookie = await buildCookieHeader();
  if (cookie) headers.set("Cookie", cookie);

  const storedToken = await tokenStorage.getAccessToken();
  const cookieToken = storedToken ? null : getCookieValue(cookie, "accessToken");
  const bearerToken = storedToken || cookieToken;
  const isAuthRoute = hasAuthRoute(config.url);

  console.log("🔑 Token retrieval:", { 
    token: bearerToken ? "✅ Found" : "❌ NULL", 
    tokenLength: bearerToken?.length || 0 
  });

  if (!bearerToken && !isAuthRoute) {
    console.warn("⚠️ Missing bearer token on protected route", {
      method: config.method?.toUpperCase(),
      url: config.url,
    });
  }
  
  if (bearerToken) {
    headers.set("Authorization", `Bearer ${bearerToken}`);
  }

  if (shouldAttachCsrfHeader(config.method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) headers.set("x-csrf-token", csrfToken);
  }

  config.headers = headers;
  const isFormData = config.data instanceof FormData;
  console.log("🔐 Request headers:", {
    method: config.method?.toUpperCase(),
    url: config.url,
    isAuthRoute,
    hasAuth: Boolean(bearerToken),
    hasCsrf: Boolean(getCsrfToken()),
    hasCookie: Boolean(cookie),
    isFormData,
  });
  return config;
};

const applyResponseAuth = async (response: any) => {
  const setCookieHeader = response?.headers?.["set-cookie"] as string | string[] | undefined;
  if (setCookieHeader) {
    const cookies = parseCookiesFromHeader(setCookieHeader);
    await syncCookiesFromServer(cookies);
  }

  await updateCsrfFromPayload(response?.data);
  return response;
};

const flushQueue = (error: unknown) => {
  const queue = failedQueue;
  failedQueue = [];
  for (const item of queue) {
    if (error) {
      item.reject(error);
    } else {
      item.resolve();
    }
  }
};

const hasAuthRoute = (url?: string): boolean => {
  if (!url) return false;
  return /\/user\/(login|refresh-token|logout)/.test(url);
};

const refreshAccessToken = async (): Promise<void> => {
  const response = await refreshClient.post("/user/refresh-token", {});
  await applyResponseAuth(response);
};

api.interceptors.request.use(applyRequestAuth);
refreshClient.interceptors.request.use(applyRequestAuth);

api.interceptors.response.use(
  applyResponseAuth,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (!originalRequest || status !== 401 || originalRequest._retry || hasAuthRoute(originalRequest.url)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => api(originalRequest));
    }

    isRefreshing = true;
    try {
      await refreshAccessToken();
      flushQueue(null);
      return api(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError);
      await tokenStorage.clearTokens();
      await clearCookies();
      clearCsrfToken();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

refreshClient.interceptors.response.use(applyResponseAuth);

function parseCookiesFromHeader(
  setCookieHeader: string | string[],
): Record<string, string> {
  const cookies: Record<string, string> = {};
  const headers = splitSetCookieHeader(setCookieHeader);

  for (const header of headers) {
    const [cookiePair] = header.split(";");
    const separatorIndex = cookiePair.indexOf("=");
    if (separatorIndex <= 0) continue;

    const name = cookiePair.slice(0, separatorIndex).trim();
    const value = cookiePair.slice(separatorIndex + 1).trim();
    if (name) {
      cookies[name] = decodeURIComponent(value || "");
    }
  }

  return cookies;
}
