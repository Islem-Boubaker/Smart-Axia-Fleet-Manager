import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { getFirebaseAuth } from "./firebaseNative";

export const subscribeToAuthState = (
  callback: (user: FirebaseAuthTypes.User | null) => void,
): (() => void) => {
  const auth = getFirebaseAuth();
  if (!auth) {
    console.warn(
      "Firebase native auth is unavailable. Skipping auth state subscription.",
    );
    return () => undefined;
  }

  return auth().onAuthStateChanged(callback);
};

export const signOutFirebase = async (): Promise<void> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    console.warn("Firebase native auth is unavailable. Skipping sign out.");
    return;
  }

  await auth().signOut();
};
