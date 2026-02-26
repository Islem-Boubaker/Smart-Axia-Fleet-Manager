

import { api } from '../../../shared/services/api';
import type { User } from '../../../types';

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

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: User['role'];
}

export const authAPI = {

  
  async signIn(credentials: SignInCredentials): Promise<AuthUser> {

    const response = await api.post('/user/login', credentials);

    return response.data.data.user;
  },


  
  async signUp(data: SignUpData): Promise<AuthUser> {

    const response = await api.post('/user/signup', data);

    return response.data.data;
  },


  
  async signOut(): Promise<void> {

    await api.post('/user/logout');
  },


  
  async refreshToken(): Promise<void> {

    await api.post('/user/refresh-token');
  },


  
  async getCurrentUser(): Promise<AuthUser> {

    const response = await api.get('/user/me');

    return response.data.data;
  },

};
