import { api } from "@/shared/services/api";
import type {
  AuthResponse,
  CreateDriverInput,
  GetUsersQuery,
  PaginatedUsers,
  UploadAvatarInput,
  User,
} from "../types/auth.types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface RefreshResponse {
  success: boolean;
  message: string;
  csrfToken?: string;
}

interface MessageResponse {
  success: boolean;
  message?: string;
  data?: {
    message?: string;
  };
}

interface ApiErrorShape {
  code?: string;
  isAxiosError?: boolean;
  config?: {
    baseURL?: string;
    url?: string;
    timeout?: number;
  };
  request?: unknown;
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
}

const normalizeApiError = (
  error: unknown,
  fallback: string,
): Error => {
  const err = error as ApiErrorShape;

  if (err?.isAxiosError && !err?.response) {
    const baseURL = err?.config?.baseURL ?? api.defaults.baseURL ?? "API";
    const reason =
      err?.code === "ECONNABORTED"
        ? "Request timeout"
        : "Unable to reach backend";

    return new Error(
      `${reason}. Check backend is running and EXPO_PUBLIC_API_URL points to your current LAN IP. Target: ${baseURL}`,
    );
  }

  const message =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback;
  return new Error(message);
};

export const login = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  try {
    const res = await api.post<ApiEnvelope<AuthResponse>>("/user/login", {
      email,
      password,
    });
    return res.data.data;
  } catch (error) {
    throw normalizeApiError(
      error,
      "Login failed. Please check your credentials and try again.",
    );
  }
};

export const refreshSession = async (): Promise<string | null> => {
  try {
    const res = await api.post<RefreshResponse>("/user/refresh-token", {});
    return res.data.csrfToken ?? null;
  } catch (error) {
    throw normalizeApiError(error, "Session refresh failed. Please sign in again.");
  }
};

export const logout = async (): Promise<void> => {
  try {
    await api.post<MessageResponse>("/user/logout", {});
  } catch (error) {
    throw normalizeApiError(error, "Logout failed.");
  }
};

export const getCurrentUser = async (): Promise<User> => {
  try {
    const res = await api.get<ApiEnvelope<User>>("/user/me");
    return res.data.data;
  } catch (error) {
    throw normalizeApiError(error, "Unable to load current user.");
  }
};

export const updateUser = async (
  userId: string,
  updates: Partial<Pick<User, "name" | "email" | "phone" | "role">>,
): Promise<User> => {
  try {
    const res = await api.put<ApiEnvelope<User>>(`/user/updateuser/${userId}`, updates);
    return res.data.data;
  } catch (error) {
    throw normalizeApiError(error, "Failed to update user.");
  }
};

export const updateUserAvatar = async (
  userId: string,
  payload: UploadAvatarInput,
): Promise<User> => {
  const formData = new FormData();
  formData.append("avatar", {
    uri: payload.uri,
    name: payload.fileName ?? `avatar-${Date.now()}.jpg`,
    type: payload.mimeType ?? "image/jpeg",
  } as any);

  try {
    const res = await api.patch<ApiEnvelope<User>>(`/user/${userId}/avatar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  } catch (error) {
    throw normalizeApiError(error, "Failed to update avatar.");
  }
};

export const createDriver = async (input: CreateDriverInput): Promise<User> => {
  try {
    if (input.avatarUri) {
      const formData = new FormData();
      formData.append("name", input.name);
      formData.append("email", input.email);
      formData.append("password", input.password);
      if (input.role) formData.append("role", input.role);
      formData.append("avatar", {
        uri: input.avatarUri,
        name: input.avatarFileName ?? `avatar-${Date.now()}.jpg`,
        type: input.avatarMimeType ?? "image/jpeg",
      } as any);

      const response = await api.post<ApiEnvelope<User>>("/user/createdriver", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data;
    }

    const response = await api.post<ApiEnvelope<User>>("/user/createdriver", {
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
    });

    return response.data.data;
  } catch (error) {
    throw normalizeApiError(error, "Failed to create driver.");
  }
};

export const getUsers = async (query: GetUsersQuery = {}): Promise<PaginatedUsers> => {
  try {
    const res = await api.get<{
      success: boolean;
      totalItems: number;
      totalPages: number;
      currentPage: number;
      data: User[];
    }>("/user/getusers", { params: query });

    return {
      totalItems: res.data.totalItems,
      totalPages: res.data.totalPages,
      currentPage: res.data.currentPage,
      data: res.data.data,
    };
  } catch (error) {
    throw normalizeApiError(error, "Failed to fetch users.");
  }
};

export const getUserById = async (userId: string): Promise<User> => {
  try {
    const res = await api.get<ApiEnvelope<User>>(`/user/getuser/${userId}`);
    return res.data.data;
  } catch (error) {
    throw normalizeApiError(error, "Failed to fetch user.");
  }
};

export const deleteUserById = async (userId: string): Promise<void> => {
  try {
    await api.delete(`/user/deleteuser/${userId}`);
  } catch (error) {
    throw normalizeApiError(error, "Failed to delete user.");
  }
};

export const requestPasswordReset = async (email: string): Promise<string> => {
  try {
    const res = await api.post<MessageResponse>("/user/forgot-password", { email });
    return res.data.data?.message ?? res.data.message ?? "Reset instructions sent.";
  } catch (error) {
    throw normalizeApiError(error, "Failed to request password reset.");
  }
};

export const toApiError = (error: unknown): Error =>
  normalizeApiError(error, "Request failed.");

export const isUnauthorizedError = (error: unknown): boolean => {
  const err = error as ApiErrorShape;
  return err?.response?.status === 401;
};

export const extractErrorMessage = (error: unknown, fallback: string): string => {
  return normalizeApiError(error, fallback).message;
};

export const verifyEmail = async (_token: string): Promise<User> => {
  throw new Error("verifyEmail endpoint is not available in the current backend routes.");
};

export const resendVerificationEmail = async (): Promise<string> => {
  throw new Error("resendVerificationEmail endpoint is not available in the current backend routes.");
};

export const updateProfile = async (
  _updates: Partial<Pick<User, "name" | "email">>,
): Promise<User> => {
  throw new Error("updateProfile endpoint is not available in the current backend routes.");
};

export const deleteAccount = async (): Promise<void> => {
  throw new Error("deleteAccount endpoint is not available in the current backend routes.");
};

export const signUp = async (
  _name: string,
  _email: string,
  _password: string,
): Promise<AuthResponse> => {
  throw new Error("signUp endpoint is not available in the current backend routes.");
};

export const signInWithApple = async (): Promise<AuthResponse> => {
  throw new Error("Apple sign-in endpoint is not available in the current backend routes.");
};

export const signInWithGoogle = async (): Promise<AuthResponse> => {
  throw new Error("Google sign-in endpoint is not available in the current backend routes.");
};

export const verifyOtpLink = async (): Promise<AuthResponse> => {
  throw new Error("OTP verification endpoint is not available in the current backend routes.");
};

export const refreshAccessToken = async (): Promise<void> => {
  await refreshSession();
};

export const resetPassword = async (
  _token: string,
  _newPassword: string,
): Promise<string> => {
  throw new Error("resetPassword endpoint is not available in the current backend routes.");
};

export const changePassword = async (
  _currentPassword: string,
  _newPassword: string,
): Promise<string> => {
  throw new Error("changePassword endpoint is not available in the current backend routes.");
};