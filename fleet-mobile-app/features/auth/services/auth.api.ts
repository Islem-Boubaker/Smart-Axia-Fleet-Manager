import { api } from "@/shared/services/api";
import type { AuthResponse, User } from "../auth.types";

// ─── Response Types ───────────────────────────────────────────────────────────

interface AuthApiResponse {
  success: boolean;
  data: AuthResponse;
}

interface MessageResponse {
  success: boolean;
  data: {
    message: string;
  };
}

interface UpdateProfileResponse {
  success: boolean;
  data: {
    user: User;
  };
}

// ─── Social Auth Payloads ─────────────────────────────────────────────────────

export interface AppleAuthPayload {
  firebaseToken: string;
  email?: string | null;        // only on first sign-in
  displayName?: string | null;  // only on first sign-in
}

export interface GoogleAuthPayload {
  firebaseToken: string;
}

// ─── Email / Password Auth ────────────────────────────────────────────────────

export const login = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  try {
    console.log("🔐 Attempting login with email:", email);
    console.log("API baseURL:", api.defaults.baseURL);

    const res = await api.post<AuthApiResponse>("/user/login", {
      email,
      password,
    });

    console.log("✅ Login successful:", res.data);

    return res.data.data;
  } catch (error: any) {
    console.error("❌ Login error caught:", error);
    console.error("Error config:", error?.config);
    console.error("Error response:", error?.response?.data);

    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Login failed. Please check your credentials and try again.";

    throw new Error(message);
  }
};

export const signUp = async (
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const res = await api.post<AuthApiResponse>("/user/signup", {
    name,
    email,
    password,
  });
  return res.data.data;
};

// ─── Social Auth (Firebase) ───────────────────────────────────────────────────

/**
 * Apple Sign-In
 * Flow: Apple sheet → Firebase credential → Firebase ID token → your backend
 * Backend verifies the Firebase token, upserts the user, sets httpOnly cookies (same as login)
 */
export const signInWithApple = async (
  payload: AppleAuthPayload,
): Promise<AuthResponse> => {
  try {
    console.log("🍎 Attempting Apple sign-in...");

    const res = await api.post<AuthApiResponse>("/auth/apple", {
      firebaseToken: payload.firebaseToken,
      // Only sent on first sign-in — Apple won't return these again
      ...(payload.email && { email: payload.email }),
      ...(payload.displayName && { displayName: payload.displayName }),
    });

    console.log("✅ Apple sign-in successful:", res.data);

    return res.data.data;
  } catch (error: any) {
    console.error("❌ Apple sign-in error:", error);

    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Apple sign-in failed. Please try again.";

    throw new Error(message);
  }
};

/**
 * Google Sign-In
 * Flow: Google OAuth → Firebase credential → Firebase ID token → your backend
 * Backend verifies the Firebase token, upserts the user, sets httpOnly cookies
 */
export const signInWithGoogle = async (
  payload: GoogleAuthPayload,
): Promise<AuthResponse> => {
  try {
    console.log("🔵 Attempting Google sign-in...");

    const res = await api.post<AuthApiResponse>("/auth/google", {
      firebaseToken: payload.firebaseToken,
    });

    console.log("✅ Google sign-in successful:", res.data);

    return res.data.data;
  } catch (error: any) {
    console.error("❌ Google sign-in error:", error);

    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Google sign-in failed. Please try again.";

    throw new Error(message);
  }
};

/**
 * Called after user taps the magic link — completes sign-in
 * Firebase verifies the link client-side, then we send the token to the backend
 */
export const verifyOtpLink = async (
  firebaseToken: string,
  email: string,
): Promise<AuthResponse> => {
  try {
    console.log("📧 Verifying OTP link for:", email);

    const res = await api.post<AuthApiResponse>("/auth/otp/verify", {
      firebaseToken,
      email,
    });

    return res.data.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "OTP verification failed. Please try again.";
    throw new Error(message);
  }
};
// ─── Session Management ───────────────────────────────────────────────────────

export const logout = async (): Promise<void> => {
  await api.post<void>("/user/logout", {});
};

export const refreshAccessToken = async (): Promise<void> => {
  await api.post<void>("/user/refresh-token", {});
};

// ─── Password Management ──────────────────────────────────────────────────────

export const requestPasswordReset = async (email: string): Promise<string> => {
  const res = await api.post<MessageResponse>("/user/forgot-password", {
    email,
  });
  return res.data.data.message;
};

export const resetPassword = async (
  token: string,
  newPassword: string,
): Promise<string> => {
  const res = await api.post<MessageResponse>("/user/reset-password", {
    token,
    newPassword,
  });
  return res.data.data.message;
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<string> => {
  const res = await api.post<MessageResponse>("/user/change-password", {
    currentPassword,
    newPassword,
  });
  return res.data.data.message;
};

// ─── Profile & Account ────────────────────────────────────────────────────────

export const verifyEmail = async (token: string): Promise<User> => {
  const res = await api.post<AuthApiResponse>("/user/verify-email", { token });
  return res.data.data.user;
};

export const resendVerificationEmail = async (): Promise<string> => {
  const res = await api.post<MessageResponse>("/user/resend-verification", {});
  return res.data.data.message;
};

export const updateProfile = async (
  updates: Partial<Pick<User, "name" | "email">>,
): Promise<User> => {
  const res = await api.patch<UpdateProfileResponse>("/user/profile", updates);
  return res.data.data.user;
};

export const deleteAccount = async (): Promise<void> => {
  await api.delete<void>("/user/account");
};