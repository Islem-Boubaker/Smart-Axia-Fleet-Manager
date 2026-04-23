

import { api } from '../../../shared/services/api';
import { setCsrfToken } from '../../../shared/services/csrfToken';
import type { User } from '../../../types';

export interface SignInCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  companyName?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: User['role'];
}

export const authAPI = {

  
  async signIn(credentials: SignInCredentials): Promise<AuthUser> {

    const response = await api.post('/user/login', credentials);

    setCsrfToken(response.data?.data?.csrfToken);

    return response.data.data.user;
  },


  
  async signUp(data: SignUpData): Promise<AuthUser> {

    const response = await api.post('/user/signup', data);

    return response.data.data;
  },


  
  async signOut(): Promise<void> {

    await api.post('/user/logout');
  },


  
  // async refreshToken(): Promise<void> {

  //   const response = await api.post('/user/refresh-token');
  //   setCsrfToken(response.data?.data?.csrfToken ?? response.data?.csrfToken);
  // },


  
  // async getCurrentUser(): Promise<AuthUser> {

  //   const response = await api.get('/user/me');

  //   return response.data.data;
  // },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/user/forgot-password', { email });
  },

};
