import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { settingsService, type UserProfile, type NotificationSettings } from '../services/settings.service';

export const useSettings = () => {
  const [error, setError] = useState<string | null>(null);

  const updateProfileMutation = useMutation({ mutationFn: settingsService.updateProfile });
  const updateNotificationsMutation = useMutation({ mutationFn: settingsService.updateNotifications });
  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      settingsService.changePassword(currentPassword, newPassword),
  });

  const getErrorMessage = (err: unknown, fallback: string) => {
    const maybeErr = err as { response?: { data?: { message?: string } }; message?: string };
    return maybeErr.response?.data?.message || maybeErr.message || fallback;
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      setError(null);
      await updateProfileMutation.mutateAsync(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to update profile'));
      throw err;
    }
  };

  const updateNotifications = async (data: Partial<NotificationSettings>) => {
    try {
      setError(null);
      await updateNotificationsMutation.mutateAsync(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to update notifications'));
      throw err;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setError(null);
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to change password'));
      throw err;
    }
  };

  const isLoading =
    updateProfileMutation.isPending ||
    updateNotificationsMutation.isPending ||
    changePasswordMutation.isPending;

  return { isLoading, error, updateProfile, updateNotifications, changePassword };
};
