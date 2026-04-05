import api from '../../../shared/services/api'; // your existing axios instance
import { tokenStorage } from './tokenStorage';
import { store } from '../../../store';
import { logout, setAccessToken } from '../../store/slices/authSlice';

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = await tokenStorage.getRefreshToken();
        const { data } = await api.post('/auth/refresh', { refreshToken: refresh });
        await tokenStorage.saveTokens(data.accessToken, data.refreshToken);
        store.dispatch(setAccessToken(data.accessToken));
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        store.dispatch(logout());
        await tokenStorage.clearTokens();
      }
    }
    return Promise.reject(error);
  }
);