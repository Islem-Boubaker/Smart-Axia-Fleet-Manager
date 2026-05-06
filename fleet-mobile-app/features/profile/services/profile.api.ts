import type { User } from "@/features/auth/types/auth.types";
import { clearUserStorage } from "@/features/auth/services/auth.session";
import { tokenStorage } from "@/features/auth/services/tokenStorage";
import { api } from "@/shared/services/api";
import { clearCookies } from "@/shared/services/cookieJar";
import { clearCsrfToken } from "@/shared/services/csrf";
import { store } from "@/store";
import { clearUser } from "@/store/slices/authSlice";

/* ================= TYPES ================= */

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface NotificationSettings {
  emailTrips: boolean;
  emailMaintenance: boolean;
  emailDrivers: boolean;
  pushTrips: boolean;
  pushMaintenance: boolean;
  pushAlerts: boolean;
  smsAlerts: boolean;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  phone?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface DriverExperienceBadge {
  key: string;
  label: string;
  minTrips: number;
}

export interface DriverRankingEvent {
  id: string;
  eventType: string;
  pointsDelta: number;
  scoreAfter: number;
  occurredAt: string;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface DriverRankingProfile {
  rank: number;
  leaderboardSize: number;
  score: number;
  completedTrips: number;
  eventCount: number;
  badge: DriverExperienceBadge;
  recentEvents: DriverRankingEvent[];
  trend: DriverRankingEvent[];
  driver: {
    id: string;
    name: string;
    email?: string;
    avatar?: string | null;
  };
}

/* ================= PROFILE ================= */

export const profileApi = {
  // 🔹 Get current user
  getCurrentUser: async (): Promise<User> => {
    const { data } = await api.get<ApiEnvelope<User>>("/user/me");
    return data.data;
  },

  // 🔹 Update current user
  updateProfile: async (payload: UpdateProfilePayload): Promise<User> => {
    const { data } = await api.put<ApiEnvelope<User>>("/user/me", payload);
    return data.data;
  },

  // 🔹 Change password
  changePassword: async (payload: ChangePasswordPayload): Promise<void> => {
    await api.post("/user/change-password", payload);
  },

  // 🔹 Upload avatar (current user)
  updateAvatar: async (formData: FormData): Promise<User> => {
    const { data } = await api.patch<ApiEnvelope<User>>(
      "/user/me/avatar",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.data;
  },

  // 🔹 Notification settings
  getNotificationSettings: async (): Promise<NotificationSettings> => {
    const { data } = await api.get<ApiEnvelope<NotificationSettings>>("/user/me/notifications");
    return data.data;
  },

  getMyRanking: async (): Promise<DriverRankingProfile> => {
    const { data } = await api.get<ApiEnvelope<DriverRankingProfile>>("/user/me/ranking");
    return data.data;
  },

  updateNotificationSettings: async (payload: Partial<NotificationSettings>): Promise<NotificationSettings> => {
    try {
      const { data } = await api.put<ApiEnvelope<NotificationSettings>>(
        "/user/me/notifications",
        payload,
      );
      return data.data;
    } catch (error: any) {
      console.error("[updateNotificationSettings] failed", {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      throw error;
    }
  },

  // 🔹 Update user (admin)
  updateUser: async (id: string, payload: Partial<User>) => {
    const { data } = await api.put<ApiEnvelope<User>>(
      `/user/updateuser/${id}`,
      payload,
    );
    return data.data;
  },

  // 🔹 Update avatar (admin)
  updateUserAvatar: async (id: string, formData: FormData) => {
    const { data } = await api.patch<ApiEnvelope<User>>(
      `/user/${id}/avatar`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.data;
  },

  // 🔹 Forgot password
  forgotPassword: async (email: string): Promise<void> => {
    await api.post("/user/forgot-password", { email });
  },

  // 🔹 Logout
  logout: async (): Promise<void> => {
    try {
      await api.post("/user/logout", {});
    } catch {
      // Local logout cleanup must still run if backend logout fails.
    } finally {
      await tokenStorage.clearTokens();
      await clearUserStorage();
      await clearCookies();
      clearCsrfToken();
      store.dispatch(clearUser());
    }
  },
};
