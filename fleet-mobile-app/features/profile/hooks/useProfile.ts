import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import type { User } from "@/features/auth/types/auth.types";
import type { AppDispatch, RootState } from "@/store";
import { setUser } from "@/store/slices/authSlice";

import {
  type DriverRankingProfile,
  profileApi,
  type ChangePasswordPayload,
  type NotificationSettings,
  type UpdateProfilePayload,
} from "../services/profile.api";

const DEFAULT_SETTINGS: NotificationSettings = {
  emailTrips: true,
  emailMaintenance: true,
  emailDrivers: false,
  pushTrips: true,
  pushMaintenance: true,
  pushAlerts: true,
  smsAlerts: false,
};

type ProfileState = {
  user: User | null;
  ranking: DriverRankingProfile | null;
  notificationSettings: NotificationSettings;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
};

function readErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export function useProfile() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const isMountedRef = useRef(true);

  const [state, setState] = useState<ProfileState>({
    user: reduxUser,
    ranking: null,
    notificationSettings: DEFAULT_SETTINGS,
    isLoading: true,
    isSaving: false,
    error: null,
  });

  const syncUser = useCallback(
    (user: User) => {
      dispatch(setUser(user));
      setState((prev) => ({ ...prev, user, error: null }));
    },
    [dispatch],
  );

  const loadProfile = useCallback(async () => {
    if (!isMountedRef.current) return;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const [user, settings, ranking] = await Promise.all([
        profileApi.getCurrentUser(),
        profileApi.getNotificationSettings().catch(() => DEFAULT_SETTINGS),
        profileApi.getMyRanking().catch(() => null),
      ]);

      syncUser(user);
      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          ranking,
          notificationSettings: settings ?? DEFAULT_SETTINGS,
          isLoading: false,
        }));
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          user: reduxUser,
          isLoading: false,
          error: readErrorMessage(error, t("profile.failedToLoad")),
        }));
      }
    }
  }, [reduxUser, syncUser, t]);

  useEffect(() => {
    isMountedRef.current = true;
    void loadProfile();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const updateProfile = useCallback(
    async (payload: UpdateProfilePayload): Promise<User> => {
      setState((prev) => ({ ...prev, isSaving: true, error: null }));
      try {
        const updatedUser = await profileApi.updateProfile(payload);
        syncUser(updatedUser);
        return updatedUser;
      } catch (error) {
        const message = readErrorMessage(error, t("editProfile.updateFailed"));
        setState((prev) => ({ ...prev, error: message }));
        throw new Error(message);
      } finally {
        setState((prev) => ({ ...prev, isSaving: false }));
      }
    },
    [syncUser, t],
  );

  const changePassword = useCallback(
    async (payload: ChangePasswordPayload): Promise<void> => {
      setState((prev) => ({ ...prev, isSaving: true, error: null }));
      try {
        await profileApi.changePassword(payload);
      } catch (error) {
        const message = readErrorMessage(error, t("profile.password.updateFailed"));
        setState((prev) => ({ ...prev, error: message }));
        throw new Error(message);
      } finally {
        setState((prev) => ({ ...prev, isSaving: false }));
      }
    },
    [t],
  );

  const updateAvatar = useCallback(
    async (formData: FormData): Promise<User> => {
      setState((prev) => ({ ...prev, isSaving: true, error: null }));
      try {
        const updatedUser = await profileApi.updateAvatar(formData);
        syncUser(updatedUser);
        return updatedUser;
      } catch (error) {
        const message = readErrorMessage(error, t("profile.avatarUpdateFailed"));
        setState((prev) => ({ ...prev, error: message }));
        throw new Error(message);
      } finally {
        setState((prev) => ({ ...prev, isSaving: false }));
      }
    },
    [syncUser, t],
  );

  const updateNotificationSettings = useCallback(
    async (payload: Partial<NotificationSettings>): Promise<NotificationSettings> => {
      setState((prev) => ({ ...prev, isSaving: true, error: null }));
      try {
        const updatedSettings = await profileApi.updateNotificationSettings(payload);
        setState((prev) => ({
          ...prev,
          notificationSettings: updatedSettings,
        }));
        return updatedSettings;
      } catch (error) {
        const message = readErrorMessage(error, t("profile.notifications.updateFailed"));
        setState((prev) => ({ ...prev, error: message }));
        throw new Error(message);
      } finally {
        setState((prev) => ({ ...prev, isSaving: false }));
      }
    },
    [t],
  );

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  return useMemo(
    () => ({
      user: state.user,
      ranking: state.ranking,
      notificationSettings: state.notificationSettings,
      isLoading: state.isLoading,
      isSaving: state.isSaving,
      error: state.error,
      refreshProfile,
      updateProfile,
      changePassword,
      updateAvatar,
      updateNotificationSettings,
    }),
    [changePassword, refreshProfile, state, updateAvatar, updateNotificationSettings, updateProfile],
  );
}
