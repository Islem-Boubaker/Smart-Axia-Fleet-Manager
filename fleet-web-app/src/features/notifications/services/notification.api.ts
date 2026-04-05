import api from "../../../shared/services/api";

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
  getAll(filters: NotificationFilters = {}) {
    return api.get(`/notifications${toQuery(filters)}`).then((response) => response.data.data);
  },

  getUnreadCount() {
    return api.get("/notifications/unread-count").then((response) => response.data.data);
  },

  markAsRead(id: string) {
    return api.patch(`/notifications/${id}/read`).then((response) => response.data);
  },

  markAllAsRead(group?: string) {
    return api.patch("/notifications/read-all", { group }).then((response) => response.data);
  },
};

export default notificationApi;
