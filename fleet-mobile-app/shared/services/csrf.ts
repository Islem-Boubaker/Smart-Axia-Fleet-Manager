import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const CSRF_KEY = "axia_csrf_token";

let csrfToken: string | null = null;

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

export const setCsrfToken = (token: string | null): void => {
	csrfToken = token;
};

export const getCsrfToken = (): string | null => {
	return csrfToken;
};

export const clearCsrfToken = (): void => {
	csrfToken = null;
};

export const saveCsrfToken = async (token: string | null): Promise<void> => {
  setCsrfToken(token);
  if (!token) {
    await deleteItem(CSRF_KEY);
    return;
  }
  await setItem(CSRF_KEY, token);
};

export const loadCsrfToken = async (): Promise<string | null> => {
  const stored = await getItem(CSRF_KEY);
  setCsrfToken(stored ?? null);
  return stored ?? null;
};

export const clearStoredCsrfToken = async (): Promise<void> => {
  clearCsrfToken();
  await deleteItem(CSRF_KEY);
};
