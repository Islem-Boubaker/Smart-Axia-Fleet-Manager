import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const COOKIE_KEYS = ["accessToken", "refreshToken", "csrf-token", "XSRF-TOKEN", "session"] as const;
const COOKIE_STORAGE_KEY = "axia_cookie_jar";

const cookieStore: Record<string, string> = {};
let isHydrated = false;

const getItem = (key: string) => {
  return Platform.OS === "web"
    ? AsyncStorage.getItem(key)
    : SecureStore.getItemAsync(key);
};

const setItem = (key: string, value: string) => {
  return Platform.OS === "web"
    ? AsyncStorage.setItem(key, value)
    : SecureStore.setItemAsync(key, value);
};

const deleteItem = (key: string) => {
  return Platform.OS === "web"
    ? AsyncStorage.removeItem(key)
    : SecureStore.deleteItemAsync(key);
};

const hydrateCookieStore = async (): Promise<void> => {
  if (isHydrated) return;
  isHydrated = true;

  try {
    const raw = await getItem(COOKIE_STORAGE_KEY);
    if (!raw) return;

    const persisted = JSON.parse(raw) as Record<string, string>;
    for (const key of COOKIE_KEYS) {
      const value = persisted[key];
      if (value) cookieStore[key] = value;
    }
  } catch {
    // Ignore invalid persisted cookie snapshots.
  }
};

const persistCookieStore = async (): Promise<void> => {
  const snapshot: Record<string, string> = {};
  for (const key of COOKIE_KEYS) {
    const value = cookieStore[key];
    if (value) snapshot[key] = value;
  }

  if (Object.keys(snapshot).length === 0) {
    await deleteItem(COOKIE_STORAGE_KEY);
    return;
  }

  await setItem(COOKIE_STORAGE_KEY, JSON.stringify(snapshot));
};

/**
 * Store cookies from server response in memory only.
 */
export const syncCookiesFromServer = async (
  cookies: Record<string, string>,
): Promise<void> => {
  await hydrateCookieStore();

  for (const key of COOKIE_KEYS) {
    if (cookies[key]) {
      cookieStore[key] = cookies[key];
      continue;
    }

    if (cookies[key] === "") {
      delete cookieStore[key];
    }
  }

  await persistCookieStore();
};

/**
 * Build Cookie header from in-memory cookies.
 * Called by axios request interceptor on every request.
 */
export const buildCookieHeader = async (): Promise<string> => {
  await hydrateCookieStore();

  const parts: string[] = [];

  for (const key of COOKIE_KEYS) {
    const value = cookieStore[key];
    if (value) parts.push(`${key}=${value}`);
  }

  return parts.join('; ');
};

/**
 * Clear all stored cookies on logout.
 */
export const clearCookies = async (): Promise<void> => {
  await hydrateCookieStore();

  for (const key of COOKIE_KEYS) {
    delete cookieStore[key];
  }

  await persistCookieStore();
};