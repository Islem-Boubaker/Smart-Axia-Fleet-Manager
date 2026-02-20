import { api } from '../../../shared/services/api';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
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

export interface GeneralSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  distanceUnit: string;
  currency: string;
}

export const settingsService = {
  getProfile: async () => {
    const response = await api.get<UserProfile>('/settings/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    const response = await api.put<UserProfile>('/settings/profile', data);
    return response.data;
  },

  getNotifications: async () => {
    const response = await api.get<NotificationSettings>('/settings/notifications');
    return response.data;
  },

  updateNotifications: async (data: Partial<NotificationSettings>) => {
    const response = await api.put<NotificationSettings>('/settings/notifications', data);
    return response.data;
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
    await api.post('/settings/change-password', { currentPassword, newPassword });
  },
};
