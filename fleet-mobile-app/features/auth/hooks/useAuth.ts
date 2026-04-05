import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSegments, useRootNavigationState } from "expo-router";
import * as Linking from "expo-linking";

import type { AppDispatch, RootState } from "@/store";
import { setLoading, setUser, clearUser } from "@/store/slices/authSlice";
import { clearCookies } from "@/shared/services/cookieJar";
import { clearCsrfToken, setCsrfToken } from "@/shared/services/csrf";

import {
  login as loginApi,
  logout as logoutApi,
  signInWithApple as appleApi,
  signInWithGoogle as googleApi,
  verifyOtpLink as verifyOtpApi,
  requestPasswordReset,
  signUp as signUpApi,
} from "../services/auth.api";
import {
  saveUserToStorage,
  loadUserFromStorage,
  clearUserStorage,
} from "../services/auth.session";

import { useGoogleAuth } from "@/lib/auth/googleAuth";
import { signInWithApple } from "@/lib/auth/appleAuth";
import {
  sendOtpEmail,
  completeEmailLinkSignIn,
  isEmailSignInLink,
} from "@/lib/auth/emailOtp";
import { signOutFirebase, subscribeToAuthState } from "@/lib/auth/firebaseAuth";
import type { AuthResponse, User } from "../auth.types";

const persistAuthSession = async (
  dispatch: AppDispatch,
  payload: AuthResponse,
): Promise<void> => {
  await saveUserToStorage(payload.user);
  setCsrfToken(payload.csrfToken);
  dispatch(setUser(payload.user));
};

export function useAuthGuard() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (isLoading) return;
    if (!navigationState?.key) return;
    if (!segments?.[0]) return;

    const inAuthGroup = segments[0] === "(auth)";
    const target = !isAuthenticated && !inAuthGroup
      ? "/(auth)/login"
      : isAuthenticated && inAuthGroup
        ? "/(tabs)/home"
        : null;

    if (!target) return;

    const timeout = setTimeout(() => {
      router.replace(target);
    }, 0);

    return () => clearTimeout(timeout);
  }, [isAuthenticated, isLoading, segments, router, navigationState?.key]);
}

export function useAuthState() {
  return useSelector((state: RootState) => state.auth);
}

export function useAuthBootstrap() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleEmailOtpLink = useCallback(
    async (url: string) => {
      const isOtpLink = await isEmailSignInLink(url);
      if (!isOtpLink) return;

      dispatch(setLoading(true));
      try {
        console.log("📧 Magic link detected:", url);
        const { firebaseToken, email } = await completeEmailLinkSignIn(url);
        const payload = await verifyOtpApi(firebaseToken, email);
        await persistAuthSession(dispatch, payload);
        router.replace("/(tabs)/home");
      } catch (err) {
        console.error("📧 Magic link sign-in failed:", err);
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, router],
  );

  useEffect(() => {
    const restore = async () => {
      dispatch(setLoading(true));
      try {
        const storedUser = await loadUserFromStorage();
        if (storedUser) {
          dispatch(setUser(storedUser));
        }
      } finally {
        dispatch(setLoading(false));
      }
    };

    restore();
  }, [dispatch]);

  useEffect(() => {
    const handleInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await handleEmailOtpLink(initialUrl);
      }
    };

    const subscription = Linking.addEventListener("url", (event) => {
      void handleEmailOtpLink(event.url);
    });

    void handleInitialUrl();

    return () => subscription.remove();
  }, [handleEmailOtpLink]);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      if (!user) {
        console.log("🔐 Firebase auth: signed out");
        return;
      }

      console.log("🔐 Firebase auth: signed in", user.uid);
    });

    return () => unsubscribe();
  }, []);
}

export function useAuthActions() {
  const dispatch = useDispatch<AppDispatch>();
  const { signInWithGoogle: signInWithGoogleSdk } = useGoogleAuth();
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);

  const loginWithEmailPassword = useCallback(
    async (email: string, password: string): Promise<User> => {
      dispatch(setLoading(true));
      try {
        console.log("🔐 Logging in with email/password...");
        const payload = await loginApi(email, password);
        await persistAuthSession(dispatch, payload);
        return payload.user;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const loginWithApple = useCallback(async (): Promise<User> => {
    dispatch(setLoading(true));
    try {
      const appleResult = await signInWithApple();
      const payload = await appleApi({
        firebaseToken: appleResult.firebaseToken,
        email: appleResult.email,
        displayName: appleResult.displayName,
      });
      await persistAuthSession(dispatch, payload);
      return payload.user;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const loginWithGoogle = useCallback(async (): Promise<User> => {
    dispatch(setLoading(true));
    try {
      const googleResult = await signInWithGoogleSdk();
      const payload = await googleApi({ firebaseToken: googleResult.firebaseToken });
      await persistAuthSession(dispatch, payload);
      return payload.user;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, signInWithGoogleSdk]);

  const sendEmailOtp = useCallback(
    async (email: string): Promise<void> => {
      console.log("📧 Requesting magic link for:", email);
      await sendOtpEmail(email);
    },
    [],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string): Promise<User> => {
      dispatch(setLoading(true));
      try {
        const payload = await signUpApi(name, email, password);
        await persistAuthSession(dispatch, payload);
        return payload.user;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const resetPassword = useCallback(
    async (email: string): Promise<void> => {
      console.log("🔐 Requesting password reset for:", email);
      await requestPasswordReset(email);
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    dispatch(setLoading(true));
    try {
      await logoutApi();
      await signOutFirebase();
      await clearUserStorage();
      await clearCookies();
      clearCsrfToken();
      dispatch(clearUser());
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  return {
    isLoading,
    loginWithEmailPassword,
    loginWithApple,
    loginWithGoogle,
    sendEmailOtp,
    resetPassword,
    signUp,
    logout,
  };
}