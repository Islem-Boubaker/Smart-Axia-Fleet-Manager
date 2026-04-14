import { useMemo } from "react";
import { Platform } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { requireFirebaseAuth } from "./firebaseNative";

WebBrowser.maybeCompleteAuthSession();

type GoogleAuthResult = {
  firebaseToken: string;
};

type GoogleClientIds = {
  webClientId?: string;
  iosClientId?: string;
  androidClientId?: string;
};

const getGoogleClientIds = (): GoogleClientIds => {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  return { webClientId, iosClientId, androidClientId };
};

const ensureGoogleClientIds = (ids: GoogleClientIds): void => {
  const missing: string[] = [];
  if (!ids.webClientId) missing.push("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID");
  if (Platform.OS === "ios" && !ids.iosClientId) {
    missing.push("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID");
  }
  if (Platform.OS === "android" && !ids.androidClientId) {
    missing.push("EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing Google client IDs: ${missing.join(", ")}. Set them in .env and restart Expo with --clear.`,
    );
  }
};

export function useGoogleAuth() {
  const clientIds = useMemo(() => getGoogleClientIds(), []);

  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    clientId: clientIds.webClientId,
    iosClientId: clientIds.iosClientId ?? clientIds.webClientId,
    androidClientId: clientIds.androidClientId ?? clientIds.webClientId,
  });

  const signInWithGoogle = async (): Promise<GoogleAuthResult> => {
    console.log("🔵 Starting Google sign-in...");
    ensureGoogleClientIds(clientIds);
    const result = await promptAsync();

    if (result?.type !== "success") {
      throw new Error("Google sign-in was cancelled.");
    }

    const idToken = result.params.id_token;
    if (!idToken) {
      throw new Error("Google sign-in did not return an ID token.");
    }

    const auth = requireFirebaseAuth();
    const credential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await auth().signInWithCredential(credential);
    const firebaseToken = await userCredential.user.getIdToken();

    console.log("🔵 Google sign-in complete.");
    return { firebaseToken };
  };

  return { signInWithGoogle, request };
}