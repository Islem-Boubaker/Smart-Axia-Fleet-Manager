import { api } from '@/shared/services/api';
import type { NotificationGroup } from '../types/notification.types';

export const notificationApi = {
  getAll: async (): Promise<NotificationGroup[]> => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },
};