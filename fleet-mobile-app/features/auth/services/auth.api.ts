import * as SecureStore from "expo-secure-store";
import { api } from "@/shared/services/api";
import { store } from "@/store";
import { setUser, clearUser } from "@/store/authSlice";
import {
  syncCookiesFromServer,
  clearCookies,
} from "@/shared/services/cookieJar";
import type { User } from "../auth.types";

// Backend response structure: { success: true, data: { ... } }
interface AuthApiResponse {
  success: boolean;
  data: {
    user: User;
    csrfToken: string;  // returned in response (not in cookie)
  };
}

interface RefreshTokenResponse {
  success: boolean;
  data: {
    accessToken: string;  // only in cookie, not in response
  };
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

interface RestoredSession {
  user: User;
  accessToken: string;
}

/**
 * Extract cookies from response headers or body.
 * Note: This function is kept for reference but cookies are now
 * extracted and synced automatically by the axios response interceptor.
 */
const extractCookiesFromResponse = (res: any): Record<string, string> => {
  const cookies: Record<string, string> = {};
  
  // Extract from Set-Cookie header(s)
  const setCookieHeader = res.headers?.['set-cookie'];
  if (setCookieHeader) {
    const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    for (const header of headers) {
      const [cookiePair] = header.split(';'); // Get name=value part before flags
      const [name, value] = cookiePair.trim().split('=');
      if (name && value) {
        cookies[name.trim()] = decodeURIComponent(value.trim());
      }
    }
  }
  
  return cookies;
};


 export const clearSession = async (): Promise<void> => {
  // In this httpOnly cookie model, the client doesn't manage access tokens
  // Only the user info is stored
  await SecureStore.deleteItemAsync("user");
};


export const login = async (email: string, password: string): Promise<User> => {
  try {
    console.log('🔐 Attempting login with email:', email);
    console.log('API baseURL:', api.defaults.baseURL);
    
    const res = await api.post<AuthApiResponse>("/user/login", {
      email,
      password,
    });
    
    console.log('✅ Login successful:', res.data);
    
    // Backend returns: { success: true, data: { user, csrfToken } }
    // Cookies (accessToken, refreshToken) are set by backend and stored in browser/SecureStore
    const { user } = res.data.data;

    await SecureStore.setItemAsync("user", JSON.stringify(user));
    store.dispatch(setUser(user));

    return user;
  } catch (error: any) {
    console.error('❌ Login error caught:', error);
    console.error('Error config:', error?.config);
    console.error('Error response:', error?.response?.data);
    
    // Handle specific error messages from backend
    const message = error?.response?.data?.message || 
                   error?.response?.data?.error ||
                   error?.message || 
                   'Login failed. Please check your credentials and try again.';
    
    throw new Error(message);
  }
};

export const signUp = async (
  name: string,
  email: string,
  password: string,
): Promise<User> => {
  const res = await api.post<AuthApiResponse>("/user/signup", {
    name,
    email,
    password,
  });
  const { user } = res.data.data;

  // Note: accessToken and refreshToken are set as httpOnly cookies
  await SecureStore.setItemAsync("user", JSON.stringify(user));
  store.dispatch(setUser(user));

  return user;
};


export const logout = async (): Promise<void> => {
  await api.post<void>("/user/logout", {});

  await clearSession();
  await clearCookies(); 
  store.dispatch(clearUser());
};


export const restoreSession = async (): Promise<RestoredSession | null> => {
  const userJson = await SecureStore.getItemAsync("user");

  if (!userJson) return null;

  try {
    const user: User = JSON.parse(userJson);
    store.dispatch(setUser(user));
    // Return a dummy accessToken since tokens are httpOnly cookies
    // The real token is managed by axios interceptors
    return { user, accessToken: "httpOnly" };
  } catch {
    await clearSession();
    await clearCookies();
    return null;
  }
};


export const refreshAccessToken = async (): Promise<string> => {
  await api.post<RefreshTokenResponse>("/user/refresh-token", {});
  // Access token and refresh token are set as httpOnly cookies by server
  // The response interceptor will handle syncing them
  return "OK";
};


export const getAccessToken = async (): Promise<string | null> => {
  // In this auth model, tokens are httpOnly cookies
  // This function is kept for compatibility but returns null
  return null;
};


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


export const verifyEmail = async (token: string): Promise<User> => {
  const res = await api.post<AuthApiResponse>("/user/verify-email", { token });
  const { user } = res.data.data;

  // Note: accessToken and refreshToken are set as httpOnly cookies
  await SecureStore.setItemAsync("user", JSON.stringify(user));
  store.dispatch(setUser(user));

  return user;
};


export const resendVerificationEmail = async (): Promise<string> => {
  const res = await api.post<MessageResponse>("/user/resend-verification", {});
  return res.data.data.message;
};


export const updateProfile = async (
  updates: Partial<Pick<User, "name" | "email">>,
): Promise<User> => {
  const res = await api.patch<UpdateProfileResponse>(
    "/user/profile",
    updates,
  );
  const { user } = res.data.data;

  await SecureStore.setItemAsync("user", JSON.stringify(user));
  store.dispatch(setUser(user));

  return user;
};


export const deleteAccount = async (): Promise<void> => {
  await api.delete<void>("/user/account");

  await clearSession();
  await clearCookies();
  store.dispatch(clearUser());
};
