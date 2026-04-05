import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const ACCESS_KEY  = 'axia_access_token';
const REFRESH_KEY = 'axia_refresh_token';

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

export const tokenStorage = {
  saveTokens: async (access: string, refresh: string) => {
    await setItem(ACCESS_KEY, access);
    await setItem(REFRESH_KEY, refresh);
  },
  getAccessToken: () => getItem(ACCESS_KEY),
  getRefreshToken: () => getItem(REFRESH_KEY),
  clearTokens: async () => {
    await deleteItem(ACCESS_KEY);
    await deleteItem(REFRESH_KEY);
  },
};