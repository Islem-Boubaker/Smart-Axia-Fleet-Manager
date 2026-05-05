import { api } from '../../../shared/services/api';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  avatar?: string;
  country?: string;
  city?: string;
  postalCode?: string;
  taxId?: string;
}

export interface NotificationSettings {
  emailTrips: boolean;
  emailMaintenance: boolean;
  emailDrivers: boolean;
  emailAI: boolean;
  emailSystem: boolean;
  pushTrips: boolean;
  pushMaintenance: boolean;
  pushDrivers: boolean;
  pushAI: boolean;
  pushSystem: boolean;
  pushAlerts: boolean;
  smsAlerts: boolean;
}

export interface GeneralSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  distanceUnit: string;
  currency: string;
}

export const settingsService = {
  getProfile: async () => {
    const response = await api.get<{ success: boolean; data: UserProfile }>('/user/me');
    return response.data.data;
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    // We send data to /user/me which maps to updateMe
    const response = await api.put<{ success: boolean; data: UserProfile }>('/user/me', data);
    return response.data.data;
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.patch<{ success: boolean; data: UserProfile }>('/user/me/avatar', formData);
    return response.data.data;
  },

  getNotifications: async () => {
    const response = await api.get<{ success: boolean; data: NotificationSettings }>('/user/me/notifications');
    return response.data.data;
  },

  updateNotifications: async (data: Partial<NotificationSettings>) => {
    const response = await api.put<{ success: boolean; data: NotificationSettings }>('/user/me/notifications', data);
    return response.data.data;
  },

  getGeneralSettings: async () => {
    const response = await api.get<GeneralSettings>('/settings/general');
    return response.data;
  },

  updateGeneralSettings: async (data: Partial<GeneralSettings>) => {
    const response = await api.put<GeneralSettings>('/settings/general', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    await api.post('/user/change-password', { currentPassword, newPassword });
  },
};
