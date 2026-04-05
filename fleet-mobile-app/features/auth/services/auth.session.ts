import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { User } from "../auth.types";

const USER_KEY = "user";

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

export const saveUserToStorage = async (user: User): Promise<void> => {
  await setItem(USER_KEY, JSON.stringify(user));
};

export const loadUserFromStorage = async (): Promise<User | null> => {
  const userJson = await getItem(USER_KEY);
  if (!userJson) return null;

  try {
    return JSON.parse(userJson) as User;
  } catch {
    await deleteItem(USER_KEY);
    return null;
  }
};

export const clearUserStorage = async (): Promise<void> => {
  await deleteItem(USER_KEY);
};
