export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
}

export type AuthProvider = 'apple' | 'google' | 'email' | 'password';

export interface AuthResponse {
  user: User;
  csrfToken: string;
}
