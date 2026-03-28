import { api } from '../../../shared/services/api';
import type { NotificationFilters } from '../types/notification.types';

// Build query string from filter object
function toQuery(params: Record<string, any>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  });
  return q.toString() ? `?${q.toString()}` : '';
}

export const notificationApi = {
  getAll(filters: NotificationFilters = {}) {
    return api.get(`/notifications${toQuery(filters)}`).then((r) => r.data.data);
  },

  getGrouped(filters: NotificationFilters = {}) {
    return api.get(`/notifications/grouped${toQuery(filters)}`).then((r) => r.data.data);
  },

  getUnreadCount() {
    return api.get('/notifications/unread-count').then((r) => r.data.data);
  },

  getById(id: string) {
    return api.get(`/notifications/${id}`).then((r) => r.data.data);
  },

  markAsRead(id: string) {
    return api.patch(`/notifications/${id}/read`).then((r) => r.data);
  },

  markAllAsRead(group?: string) {
    return api.patch('/notifications/read-all', { group }).then((r) => r.data);
  },

  archive(id: string) {
    return api.patch(`/notifications/${id}/archive`).then((r) => r.data);
  },

  delete(id: string) {
    return api.delete(`/notifications/${id}`).then((r) => r.data);
  },

  registerPushToken(userId: string, token: string) {
    return api.post('/user/register-push-token', { userId, token }).then((r) => r.data);
  },
};