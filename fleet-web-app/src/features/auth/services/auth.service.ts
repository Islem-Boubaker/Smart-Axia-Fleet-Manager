import { api } from '../../../shared/services/api';

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  companyName?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  token: string;
}

export const authService = {
  signIn: async (credentials: SignInCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/signin', credentials);
    return response.data;
  },

  signUp: async (data: SignUpData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/signup', data);
    return response.data;
  },

  signOut: async (): Promise<void> => {
    await api.post('/auth/signout');
    localStorage.removeItem('token');
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const response = await api.post<{ token: string }>('/auth/refresh');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
