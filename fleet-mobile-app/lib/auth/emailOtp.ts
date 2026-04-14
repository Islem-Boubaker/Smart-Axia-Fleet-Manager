import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getFirebaseAuth, requireFirebaseAuth } from "./firebaseNative";

const OTP_EMAIL_KEY = "axia_otp_email";

const actionCodeSettings = {
  url: "fleetmobileapp://auth/otp",
  handleCodeInApp: true,
  iOS: { bundleId: "com.islemboubaker.SmartAxiaFleetManager" },
  android: {
    packageName: "com.islemboubaker.SmartAxiaFleetManager",
    installApp: true,
  },
};

export async function sendOtpEmail(email: string): Promise<void> {
  if (Platform.OS === "web") {
    throw new Error("Email OTP is not supported on web.");
  }

  console.log("📧 Sending magic link to:", email);
  const auth = requireFirebaseAuth();
  await auth().sendSignInLinkToEmail(email, actionCodeSettings);
  await AsyncStorage.setItem(OTP_EMAIL_KEY, email);
}

export async function getStoredOtpEmail(): Promise<string | null> {
  return AsyncStorage.getItem(OTP_EMAIL_KEY);
}

export async function clearStoredOtpEmail(): Promise<void> {
  await AsyncStorage.removeItem(OTP_EMAIL_KEY);
}

export async function isEmailSignInLink(url: string): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    // In Expo Go, native Firebase auth is unavailable.
    return false;
  }

  return auth().isSignInWithEmailLink(url);
}

export async function completeEmailLinkSignIn(
  url: string,
): Promise<{ firebaseToken: string; email: string }> {
  if (Platform.OS === "web") {
    throw new Error("Email OTP is not supported on web.");
  }

  const email = await getStoredOtpEmail();
  if (!email) {
    throw new Error("Missing stored email for OTP sign-in.");
  }

  console.log("📧 Completing magic link sign-in for:", email);
  const auth = requireFirebaseAuth();
  const userCredential = await auth().signInWithEmailLink(email, url);
  const firebaseToken = await userCredential.user.getIdToken();

  await clearStoredOtpEmail();
  return { firebaseToken, email };
}