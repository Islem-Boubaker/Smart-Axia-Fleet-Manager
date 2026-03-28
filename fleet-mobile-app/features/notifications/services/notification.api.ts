import { api } from '@/shared/services/api';
import type { NotificationFilters } from '../types/notification.types';

function toQuery(params: Record<string, any>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  });
  return q.toString() ? `?${q.toString()}` : '';
}

export const notificationApi = {
  async getAll(filters: NotificationFilters = {}) {
    const r = await api.get(`/notifications${toQuery(filters)}`);
    return r.data.data;
  },

  async getGrouped(filters: NotificationFilters = {}) {
    const r = await api.get(`/notifications/grouped${toQuery(filters)}`);
    return r.data.data;
  },

  async getUnreadCount() {
    const r = await api.get('/notifications/unread-count');
    return r.data.data;
  },

  async getById(id: string) {
    const r = await api.get(`/notifications/${id}`);
    return r.data.data;
  },

  async markAsRead(id: string) {
    const r = await api.patch(`/notifications/${id}/read`);
    return r.data;
  },

  async markAllAsRead(group?: string) {
    const r = await api.patch('/notifications/read-all', { group });
    return r.data;
  },

  async archive(id: string) {
    const r = await api.patch(`/notifications/${id}/archive`);
    return r.data;
  },

  async delete(id: string) {
    const r = await api.delete(`/notifications/${id}`);
    return r.data;
  },

  async registerPushToken(userId: string, token: string) {
    const r = await api.post('/user/register-push-token', { userId, token });
    return r.data;
  },
};