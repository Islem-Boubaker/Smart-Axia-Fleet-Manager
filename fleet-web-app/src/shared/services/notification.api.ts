import api from "./api";

export interface NotificationRecord {
  id: string;
  userId: string;
  type: string;
  group: string;
  priority: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  actionUrl?: string | null;
  metadata?: Record<string, unknown>;
  read: boolean;
  readAt?: string | null;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  group?: string;
  priority?: string;
  type?: string;
  unread?: boolean | string;
  archived?: boolean | string;
  since?: string;
}

function toQuery(params: NotificationFilters | Record<string, unknown>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const notificationApi = {
  async getAll(filters: NotificationFilters = {}) {
    const response = await api.get(`/notifications${toQuery(filters)}`);
    return response.data.data;
  },

  async getUnreadCount() {
    const response = await api.get("/notifications/unread-count");
    return response.data.data;
  },

  async markAsRead(id: string) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead(group?: string) {
    const response = await api.patch("/notifications/read-all", { group });
    return response.data;
  },
};

export default notificationApi;
