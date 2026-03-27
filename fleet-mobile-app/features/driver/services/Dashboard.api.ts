import { api } from '@/src/shared/services/api';
import type { LoginCredentials, SignupData, AuthResponse } from '../auth.types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/login', credentials);
  },

  signup: async (data: SignupData): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/signup', data);
  },

  logout: async (): Promise<void> => {
    return api.post<void>('/auth/logout', {});
  },

  refreshToken: async (): Promise<{ token: string }> => {
    return api.post<{ token: string }>('/auth/refresh', {});
  },
};
