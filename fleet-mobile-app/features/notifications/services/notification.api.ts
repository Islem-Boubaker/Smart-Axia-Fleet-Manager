import { api } from "@/shared/services/api";
import type { NotificationFilters } from "../types/notification.types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

function toQuery(params: Record<string, any>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  });
  return q.toString() ? `?${q.toString()}` : "";
}

export const notificationApi = {
  async getAll(filters: NotificationFilters = {}) {
    const r = await api.get<ApiEnvelope<unknown>>(
      `/notifications${toQuery(filters)}`,
    );
    return r.data.data;
  },

  async getGrouped(filters: NotificationFilters = {}) {
    const r = await api.get<ApiEnvelope<unknown>>(
      `/notifications/grouped${toQuery(filters)}`,
    );
    return r.data.data;
  },

  async getUnreadCount() {
    const r = await api.get<ApiEnvelope<{ count: number }>>(
      "/notifications/unread-count",
    );
    return r.data.data;
  },

  async getById(id: string) {
    const r = await api.get<ApiEnvelope<unknown>>(`/notifications/${id}`);
    return r.data.data;
  },

  async markAsRead(id: string) {
    const r = await api.patch<ApiEnvelope<unknown>>(
      `/notifications/${id}/read`,
    );
    return r.data.data;
  },

  async markAllAsRead(group?: string) {
    const r = await api.patch<ApiEnvelope<unknown>>("/notifications/read-all", {
      group,
    });
    return r.data.data;
  },

  async archive(id: string) {
    const r = await api.patch<ApiEnvelope<unknown>>(
      `/notifications/${id}/archive`,
    );
    return r.data.data;
  },

  async delete(id: string) {
    const r = await api.delete<ApiEnvelope<unknown>>(`/notifications/${id}`);
    return r.data.data;
  },

  async registerPushToken(userId: string, token: string) {
    const r = await api.post("/user/register-push-token", { userId, token });
    return r.data;
  },
};
