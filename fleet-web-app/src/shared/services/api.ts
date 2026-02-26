
// src/lib/api.ts

import axios, {
  AxiosError
} from "axios";
import type { AxiosInstance,AxiosRequestConfig,
  AxiosResponse, InternalAxiosRequestConfig } from "axios";

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


api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const csrfToken = getCsrfTokenFromCookie();

    if (csrfToken) {
      config.headers["x-csrf-token"] = csrfToken;
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
  (response: AxiosResponse): AxiosResponse => response,

  async (error: AxiosError): Promise<AxiosResponse | Promise<never>> => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!error.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;

    
    if (
      status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/user/refresh-token")
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

     
        window.location.href = "/signin";

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

