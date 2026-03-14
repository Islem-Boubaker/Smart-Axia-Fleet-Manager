import * as SecureStore from 'expo-secure-store';
import { api } from '../../../shared/services/api';
import { store } from '../../../store';
import { setUser, clearUser } from '../../../store/authSlice';
import type { User } from '../auth.types';

interface LoginApiResponse {
  data: {
    user: User;
    accessToken: string;
  };
}

export const login = async (email: string, password: string) => {
  const res = await api.post<LoginApiResponse>('/user/login', { email, password });
  const { user, accessToken } = res.data;

  // ── Save to secure storage ──
  await SecureStore.setItemAsync('accessToken', accessToken);
  await SecureStore.setItemAsync('user', JSON.stringify(user));

  // ── Update Redux → triggers useAuthGuard → redirects to home ──
  store.dispatch(setUser(user));

  return user;
};

export const logout = async () => {
  await api.post<void>('/user/logout', {});

  // ── Clear secure storage ──
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('user');

  // ── Update Redux → triggers useAuthGuard → redirects to login ──
  store.dispatch(clearUser());
};