export type UserRole = "ADMIN" | "MANAGER" | "DRIVER";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  avatar?: string | null;
  assignedVehicle?: string | null;
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
  accessToken: string;   // ← New: returned by backend for mobile
  refreshToken: string;  // ← New: returned by backend for mobile
}

export interface PaginatedUsers {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: User[];
}

export interface CreateDriverInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  avatarUri?: string;
  avatarFileName?: string;
  avatarMimeType?: string;
}

export interface UploadAvatarInput {
  uri: string;
  fileName?: string;
  mimeType?: string;
}

export interface GetUsersQuery {
  page?: number;
  limit?: number;
}
