
import axios, {
  AxiosError
} from "axios";
import type { AxiosInstance,AxiosRequestConfig,
  AxiosResponse, InternalAxiosRequestConfig } from "axios";

import { getCsrfToken, setCsrfToken, clearCsrfToken } from './csrfToken';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


function getCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrf-token="));

  return match ? match.split("=")[1] : null;
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
  },
});

const csrfBootstrapClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const AUTH_ENDPOINTS = [
  '/user/login',
  '/user/signup',
  '/user/forgot-password',
  '/user/refresh-token',
];

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

async function ensureCsrfToken(): Promise<string | null> {
  const existing = getCsrfToken();
  if (existing) return existing;

  try {
    const response = await csrfBootstrapClient.post('/user/refresh-token');
    const token = response.data?.data?.csrfToken ?? response.data?.csrfToken;
    setCsrfToken(token);
    return getCsrfToken();
  } catch {
    return null;
  }
}

function shouldAttachCsrf(config: InternalAxiosRequestConfig): boolean {
  const method = (config.method || 'get').toUpperCase();
  return method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
}


api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    if (shouldAttachCsrf(config) && !isAuthEndpoint(config.url)) {
      const token = getCsrfToken() || getCsrfTokenFromCookie() || (await ensureCsrfToken());
      if (token) {
        config.headers["X-CSRF-Token"] = token;
      }
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);



let isRefreshing = false;

let pendingQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}[] = [];

function processQueue(error: unknown): void {
  pendingQueue.forEach((promise) => {
    if (error) promise.reject(error);
    else promise.resolve(undefined);
  });

  pendingQueue = [];
}

api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    const token = response.data?.data?.csrfToken ?? response.data?.csrfToken;
    if (token) setCsrfToken(token);
    return response;
  },

  async (error: AxiosError): Promise<AxiosResponse | Promise<never>> => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!error.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;

    if (status === 403) {
      const data = error.response.data as unknown;
      const message =
        typeof data === 'object' && data !== null && 'message' in data
          ? (data as { message?: unknown }).message
          : undefined;
      if (typeof message === 'string' && message.toLowerCase().includes('csrf')) {
        clearCsrfToken();
      }
    }

    
    if (
      status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/user/refresh-token");

        processQueue(null);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);

        if (window.location.pathname !== "/signin") {
          window.location.href = "/signin";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);



export default api;
export { api };

