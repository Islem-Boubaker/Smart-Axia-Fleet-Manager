import * as AppleAuthentication from "expo-apple-authentication";
import { requireFirebaseAuth } from "./firebaseNative";

type AppleAuthResult = {
  firebaseToken: string;
  email?: string | null;
  displayName?: string | null;
};

const buildDisplayName = (
  fullName?: AppleAuthentication.AppleAuthenticationFullName | null,
): string | null => {
  if (!fullName) return null;
  const parts = [fullName.givenName, fullName.familyName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
};

export async function signInWithApple(): Promise<AppleAuthResult> {
  console.log("🍎 Starting Apple sign-in...");
  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  const { identityToken } = appleCredential;
  if (!identityToken) throw new Error("No identity token returned by Apple.");

  const auth = requireFirebaseAuth();
  const credential = auth.AppleAuthProvider.credential(identityToken);
  const userCredential = await auth().signInWithCredential(credential);
  const firebaseToken = await userCredential.user.getIdToken();

  const displayName = buildDisplayName(appleCredential.fullName);
  const email = appleCredential.email ?? userCredential.user.email ?? null;

  console.log("🍎 Apple sign-in complete.");
  return { firebaseToken, email, displayName };
}