import { useState } from 'react';
import { settingsService, type UserProfile, type NotificationSettings } from '../services/settings.service';

export const useSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      setIsLoading(true);
      await settingsService.updateProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateNotifications = async (data: Partial<NotificationSettings>) => {
    try {
      setIsLoading(true);
      await settingsService.updateNotifications(data);
    } catch (err: any) {
      setError(err.message || 'Failed to update notifications');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);
      await settingsService.changePassword(currentPassword, newPassword);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, updateProfile, updateNotifications, changePassword };
};
