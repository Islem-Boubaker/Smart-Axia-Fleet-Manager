import * as SecureStore from 'expo-secure-store';

const COOKIE_KEYS = ['refreshToken', 'session'] as const;

/**
 * Store cookies from server response in SecureStore.
 * In Expo managed workflow, we don't use native CookieManager.
 * Instead, store httpOnly cookies manually from response headers.
 */
export const syncCookiesFromServer = async (cookies: Record<string, string>): Promise<void> => {
  for (const key of COOKIE_KEYS) {
    if (cookies[key]) {
      await SecureStore.setItemAsync(key, cookies[key]);
    }
  }
};

/**
 * Build Cookie header from stored cookies.
 * Called by axios request interceptor on every request.
 */
export const buildCookieHeader = async (): Promise<string> => {
  const parts: string[] = [];

  for (const key of COOKIE_KEYS) {
    const value = await SecureStore.getItemAsync(key);
    if (value) parts.push(`${key}=${value}`);
  }

  return parts.join('; ');
};

/**
 * Clear all stored cookies on logout.
 */
export const clearCookies = async (): Promise<void> => {
  for (const key of COOKIE_KEYS) {
    await SecureStore.deleteItemAsync(key);
  }
};