import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSegments, useRootNavigationState } from "expo-router";
import * as Linking from "expo-linking";

import type { AppDispatch, RootState } from "@/store";
import {
  clearError,
  clearUser,
  setError,
  setLoading,
  setProvider,
  setUser,
} from "@/store/slices/authSlice";
import { clearCookies } from "@/shared/services/cookieJar";
import { clearCsrfToken, setCsrfToken } from "@/shared/services/csrf";
import { tokenStorage } from "../services/tokenStorage";
import {
  clearUserStorage,
  loadUserFromStorage,
  saveUserToStorage,
} from "../services/auth.session";

import {
  createDriver,
  deleteUserById,
  extractErrorMessage,
  getCurrentUser,
  getUserById,
  getUsers,
  isUnauthorizedError,
  login as loginApi,
  logout as logoutApi,
  requestPasswordReset,
  refreshSession,
  updateUser as updateUserApi,
  updateUserAvatar as updateUserAvatarApi,
} from "../services/auth.api";
import { useGoogleAuth } from "@/lib/auth/googleAuth";
import { signInWithApple } from "@/lib/auth/appleAuth";
import {
  sendOtpEmail,
  completeEmailLinkSignIn,
  isEmailSignInLink,
} from "@/lib/auth/emailOtp";
import { signOutFirebase, subscribeToAuthState } from "@/lib/auth/firebaseAuth";
import type { AuthResponse, CreateDriverInput, GetUsersQuery, UploadAvatarInput, User, UserRole } from "../types/auth.types";

const persistAuthSession = async (
  dispatch: AppDispatch,
  payload: AuthResponse,
): Promise<void> => {
  setCsrfToken(payload.csrfToken);
  
  // ✅ Save tokens to secure storage (new!)
  if (payload.accessToken && payload.refreshToken) {
    await tokenStorage.saveTokens(payload.accessToken, payload.refreshToken);
    console.log("✅ Tokens saved to secure storage");
  }
  
  await saveUserToStorage(payload.user);
  dispatch(setUser(payload.user));
};

const clearSession = async (dispatch: AppDispatch): Promise<void> => {
  await tokenStorage.clearTokens();
  await clearCookies();
  await clearUserStorage();
  clearCsrfToken();
  dispatch(clearUser());
};

const bootstrapSession = async (dispatch: AppDispatch): Promise<void> => {
  dispatch(setLoading(true));

  const cachedUser = await loadUserFromStorage();
  if (cachedUser) {
    dispatch(setUser(cachedUser));
    dispatch(setLoading(true));
  }

  try {
    const currentUser = await getCurrentUser();
    dispatch(setUser(currentUser));
    await saveUserToStorage(currentUser);
  } catch (error) {
    if (!isUnauthorizedError(error)) {
      dispatch(setLoading(false));
      return;
    }

    try {
      await refreshSession();
      const currentUser = await getCurrentUser();
      dispatch(setUser(currentUser));
      await saveUserToStorage(currentUser);
    } catch {
      await clearSession(dispatch);
    }
  } finally {
    dispatch(setLoading(false));
  }
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
      try {
        const isOtpLink = await isEmailSignInLink(url);
        if (!isOtpLink) return;

        dispatch(setLoading(true));
        console.log("📧 Magic link detected:", url);
        await completeEmailLinkSignIn(url);

        // Backend currently exposes /user/login + cookie refresh flow.
        // Email-link verification does not establish backend auth session directly.
        dispatch(setError("Magic link verified with Firebase. Please sign in to start your backend session."));
        router.replace("/(auth)/login");
      } catch (err) {
        console.error("📧 Magic link sign-in failed:", err);
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, router],
  );

  useEffect(() => {
    void bootstrapSession(dispatch);
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
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);

  const loginWithEmailPassword = useCallback(
    async (email: string, password: string): Promise<User> => {
      dispatch(clearError());
      dispatch(setProvider("email"));
      dispatch(setLoading(true));
      try {
        console.log("🔐 Logging in with email/password...");
        const payload = await loginApi(email, password);
        await persistAuthSession(dispatch, payload);
        return payload.user;
      } catch (error: unknown) {
        const message = extractErrorMessage(error, "Login failed. Please try again.");
        dispatch(setError(message));
        throw error;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const loginWithApple = useCallback(async (): Promise<User> => {
    dispatch(clearError());
    dispatch(setProvider("apple"));
    dispatch(setLoading(true));
    try {
      await signInWithApple();
      throw new Error("Apple sign-in is not configured on this backend. Use email/password login.");
    } catch (error: unknown) {
      const message = extractErrorMessage(error, "Apple sign-in failed.");
      dispatch(setError(message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const loginWithGoogle = useCallback(async (): Promise<User> => {
    dispatch(clearError());
    dispatch(setProvider("google"));
    dispatch(setLoading(true));
    try {
      await signInWithGoogleSdk();
      throw new Error("Google sign-in is not configured on this backend. Use email/password login.");
    } catch (error: unknown) {
      const message = extractErrorMessage(error, "Google sign-in failed.");
      dispatch(setError(message));
      throw error;
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

  const signUp = useCallback(async (): Promise<User> => {
    throw new Error("Public sign-up is not available. Use createDriver as ADMIN/MANAGER.");
  }, []);

  const resetPassword = useCallback(
    async (email: string): Promise<void> => {
      console.log("🔐 Requesting password reset for:", email);
      await requestPasswordReset(email);
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    dispatch(clearError());
    dispatch(setProvider(null));
    dispatch(setLoading(true));
    try {
      await logoutApi();
      await signOutFirebase();
      await clearSession(dispatch);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const refreshAuth = useCallback(async (): Promise<void> => {
    dispatch(clearError());
    try {
      await refreshSession();
      const me = await getCurrentUser();
      dispatch(setUser(me));
      await saveUserToStorage(me);
    } catch (error: unknown) {
      const message = extractErrorMessage(error, "Session refresh failed.");
      dispatch(setError(message));
      throw error;
    }
  }, [dispatch]);

  const getMe = useCallback(async (): Promise<User> => {
    try {
      const me = await getCurrentUser();
      dispatch(setUser(me));
      await saveUserToStorage(me);
      return me;
    } catch (error: unknown) {
      const message = extractErrorMessage(error, "Unable to fetch user profile.");
      dispatch(setError(message));
      throw error;
    }
  }, [dispatch]);

  const updateUserById = useCallback(
    async (
      userId: string,
      updates: Partial<Pick<User, "name" | "email" | "phone" | "role">>,
    ): Promise<User> => {
      try {
        const updated = await updateUserApi(userId, updates);
        if (user?.id === updated.id) {
          dispatch(setUser(updated));
          await saveUserToStorage(updated);
        }
        return updated;
      } catch (error: unknown) {
        const message = extractErrorMessage(error, "Failed to update user.");
        dispatch(setError(message));
        throw error;
      }
    },
    [dispatch, user?.id],
  );

  const updateAvatar = useCallback(
    async (userId: string, payload: UploadAvatarInput): Promise<User> => {
      try {
        const updated = await updateUserAvatarApi(userId, payload);
        if (user?.id === updated.id) {
          dispatch(setUser(updated));
          await saveUserToStorage(updated);
        }
        return updated;
      } catch (error: unknown) {
        const message = extractErrorMessage(error, "Failed to update avatar.");
        dispatch(setError(message));
        throw error;
      }
    },
    [dispatch, user?.id],
  );

  const createDriverUser = useCallback(
    async (payload: CreateDriverInput): Promise<User> => {
      try {
        return await createDriver(payload);
      } catch (error: unknown) {
        const message = extractErrorMessage(error, "Failed to create driver.");
        dispatch(setError(message));
        throw error;
      }
    },
    [dispatch],
  );

  const listUsers = useCallback(async (query?: GetUsersQuery) => {
    try {
      return await getUsers(query);
    } catch (error: unknown) {
      const message = extractErrorMessage(error, "Failed to fetch users.");
      dispatch(setError(message));
      throw error;
    }
  }, [dispatch]);

  const getUser = useCallback(async (userId: string): Promise<User> => {
    try {
      return await getUserById(userId);
    } catch (error: unknown) {
      const message = extractErrorMessage(error, "Failed to fetch user.");
      dispatch(setError(message));
      throw error;
    }
  }, [dispatch]);

  const removeUser = useCallback(async (userId: string): Promise<void> => {
    try {
      await deleteUserById(userId);
    } catch (error: unknown) {
      const message = extractErrorMessage(error, "Failed to delete user.");
      dispatch(setError(message));
      throw error;
    }
  }, [dispatch]);

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      if (!user?.role) return false;
      const acceptedRoles = Array.isArray(roles) ? roles : [roles];
      return acceptedRoles.includes(user.role);
    },
    [user?.role],
  );

  const roleFlags = useMemo(
    () => ({
      isAdmin: user?.role === "ADMIN",
      isManager: user?.role === "MANAGER",
      isDriver: user?.role === "DRIVER",
    }),
    [user?.role],
  );

  return {
    isLoading,
    user,
    loginWithEmailPassword,
    loginWithApple,
    loginWithGoogle,
    sendEmailOtp,
    resetPassword,
    signUp,
    logout,
    refreshAuth,
    getMe,
    updateUserById,
    updateAvatar,
    createDriverUser,
    listUsers,
    getUser,
    removeUser,
    hasRole,
    ...roleFlags,
  };
}