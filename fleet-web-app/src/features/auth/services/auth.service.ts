// ─────────────────────────────────────────────────────────────
//  Auth API — cookie-based (tokens are NEVER in JavaScript)
//
//  The backend sets/clears httpOnly cookies automatically.
//  This service only deals with the JSON body (user profile).
// ─────────────────────────────────────────────────────────────
import { api, setCsrfToken } from '../../../shared/services/api';
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
  /**
   * POST /user/login
   * Backend sets accessToken + refreshToken + csrf-token cookies.
   * We only return the user object from the JSON body.
   */
  async signIn(credentials: SignInCredentials): Promise<AuthUser> {
    const response = await api.post('/user/login', credentials);
    // Backend returns { success: true, data: { user, csrfToken } }
    setCsrfToken(response.data.data.csrfToken);
    return response.data.data.user;
  },

  /**
   * POST /user/signup
   */
  async signUp(data: SignUpData): Promise<AuthUser> {
    const response = await api.post('/user/signup', data);
    return response.data.data;
  },

  /**
   * POST /user/logout — clears all auth cookies server-side.
   */
  async signOut(): Promise<void> {
    await api.post('/user/logout');
    setCsrfToken(null);
  },

  /**
   * POST /user/refresh-token — silently refreshes the access cookie.
   */
  async refreshToken(): Promise<void> {
    const response = await api.post('/user/refresh-token');
    if (response.data?.csrfToken) {
      setCsrfToken(response.data.csrfToken);
    }
  },

  /**
   * GET /user/me — returns the authenticated user's profile.
   */
  async getCurrentUser(): Promise<AuthUser> {
    const response = await api.get('/user/me');
    return response.data.data;
  },
};