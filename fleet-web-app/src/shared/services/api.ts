// ─────────────────────────────────────────────────────────────
//  Axios instance — cookie-based auth (no localStorage)
//
//  Security model:
//    • accessToken & refreshToken are in httpOnly cookies
//      → the browser sends them automatically
//    • CSRF token lives in a readable cookie; we copy it to
//      the X-CSRF-Token header on every mutating request
//    • On 401 the interceptor silently attempts a token refresh
//      before redirecting to /signin
// ─────────────────────────────────────────────────────────────
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ── Helper: read a cookie by name ────────────────────────────
function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1];
}

// ── Create Axios instance ────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,                  // ← send cookies on every request
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach CSRF token ───────────────────
api.interceptors.request.use((config) => {
  const csrf = getCookie('csrf-token');
  if (csrf) {
    config.headers['X-CSRF-Token'] = csrf;
  }
  return config;
});

// ── Response interceptor: silent refresh on 401 ──────────────
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown) {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(undefined)));
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh for 401 that is NOT the refresh call itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/user/refresh-token')
    ) {
      if (isRefreshing) {
        // Queue this request until refresh resolves
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/user/refresh-token');
        processQueue(null);
        return api(originalRequest);           // retry original request
      } catch (refreshError) {
        processQueue(refreshError);
        window.location.href = '/signin';       // refresh failed → re-login
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Domain-specific API helpers ──────────────────────────────

export const vehiclesAPI = {
  getAll: () => api.get('/vehicles'),
  getById: (id: string) => api.get(`/vehicles/${id}`),
  create: (data: Record<string, unknown>) => api.post('/vehicles', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/vehicles/${id}`, data),
  delete: (id: string) => api.delete(`/vehicles/${id}`),
};

export const driversAPI = {
  getAll: () => api.get('/user/getusers'),
  getById: (id: string) => api.get(`/user/getuser/${id}`),
  create: (data: Record<string, unknown>) => api.post('/user/createdriver', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/user/updateuser/${id}`, data),
  delete: (id: string) => api.delete(`/user/deleteuser/${id}`),
};

export const tripsAPI = {
  getAll: () => api.get('/trips'),
  getById: (id: string) => api.get(`/trips/${id}`),
  create: (data: Record<string, unknown>) => api.post('/trips', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/trips/${id}`, data),
  delete: (id: string) => api.delete(`/trips/${id}`),
};

export const maintenanceAPI = {
  getAll: () => api.get('/maintenance'),
  getById: (id: string) => api.get(`/maintenance/${id}`),
  create: (data: Record<string, unknown>) => api.post('/maintenance', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/maintenance/${id}`, data),
  delete: (id: string) => api.delete(`/maintenance/${id}`),
};

export { api };
export default api;
