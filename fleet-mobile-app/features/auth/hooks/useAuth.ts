import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSegments, useRootNavigationState } from "expo-router";

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
import { clearStoredCsrfToken, loadCsrfToken, saveCsrfToken } from "@/shared/services/csrf";
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
import type { AuthResponse, CreateDriverInput, GetUsersQuery, UploadAvatarInput, User, UserRole } from "../types/auth.types";

const persistAuthSession = async (
  dispatch: AppDispatch,
  payload: AuthResponse,
): Promise<void> => {
  await saveCsrfToken(payload.csrfToken || null);
  
  // Persist bearer token for mobile requests; refresh token may be cookie-managed.
  if (payload.accessToken) {
    await tokenStorage.saveTokens(payload.accessToken, payload.refreshToken ?? "");
    const savedAccessToken = await tokenStorage.getAccessToken();
    console.log("✅ Tokens saved to secure storage", {
      accessTokenSaved: Boolean(savedAccessToken),
      accessTokenLength: savedAccessToken?.length || 0,
    });
  }
  
  await saveUserToStorage(payload.user);
  dispatch(setUser(payload.user));
};

const clearSession = async (dispatch: AppDispatch): Promise<void> => {
  await tokenStorage.clearTokens();
  await clearCookies();
  await clearUserStorage();
  await clearStoredCsrfToken();
  dispatch(clearUser());
};

const assertMobileDriver = async (
  dispatch: AppDispatch,
  user: User | null | undefined,
): Promise<User> => {
  if (user?.role === "DRIVER") return user;

  await clearSession(dispatch);
  throw new Error("Only driver accounts can sign in to the mobile app.");
};

const bootstrapSession = async (dispatch: AppDispatch): Promise<void> => {
  dispatch(setLoading(true));

  const cachedUser = await loadUserFromStorage();
  const cachedAccessToken = await tokenStorage.getAccessToken();
  await loadCsrfToken();

  if (!cachedUser && !cachedAccessToken) {
    dispatch(setLoading(false));
    return;
  }

  if (cachedUser) {
    if (cachedUser.role !== "DRIVER") {
      await clearSession(dispatch);
      dispatch(setLoading(false));
      return;
    }

    dispatch(setUser(cachedUser));
    dispatch(setLoading(true));
  }

  try {
    const currentUser = await getCurrentUser();
    await assertMobileDriver(dispatch, currentUser);
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
      await assertMobileDriver(dispatch, currentUser);
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

  useEffect(() => {
    void bootstrapSession(dispatch);
  }, [dispatch]);
}

export function useAuthActions() {
  const dispatch = useDispatch<AppDispatch>();
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
        await assertMobileDriver(dispatch, payload.user);
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
