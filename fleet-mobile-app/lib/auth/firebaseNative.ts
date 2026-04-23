import Constants from "expo-constants";
import { Platform } from "react-native";

type FirebaseAuth = typeof import("@react-native-firebase/auth").default;

let cachedAuth: FirebaseAuth | null | undefined;

export const getFirebaseAuth = (): FirebaseAuth | null => {
  if (cachedAuth !== undefined) {
    return cachedAuth;
  }

  if (Platform.OS === "web") {
    cachedAuth = null;
    return cachedAuth;
  }

  if (Constants.appOwnership === "expo") {
    cachedAuth = null;
    return cachedAuth;
  }

  try {
    const mod = require("@react-native-firebase/auth") as
      | { default: FirebaseAuth }
      | FirebaseAuth;
    cachedAuth = "default" in mod ? mod.default : mod;
  } catch (err) {
    cachedAuth = null;
  }

  return cachedAuth;
};

export const requireFirebaseAuth = (): FirebaseAuth => {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error(
      "Firebase native auth is unavailable. Use an Expo dev build or remove @react-native-firebase usage for Expo Go.",
    );
  }

  return auth;
};
