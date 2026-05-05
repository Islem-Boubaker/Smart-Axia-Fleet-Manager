import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FiLock } from 'react-icons/fi';
import { Button, Input } from '../../../shared/components';


interface Props {
  dark?: boolean;
  isLoading?: boolean;
  onChangePassword?: (currentPassword: string, newPassword: string) => Promise<void>;
}

const SecuritySettings = ({ dark = false, isLoading = false, onChangePassword }: Props) => {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const label = dark ? 'text-slate-400' : 'text-gray-700';
  const input = dark ? 'border-slate-600 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 rounded-xl' : 'rounded-xl';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setFormError(t('settings.security.errors.fill_all_fields'));
      return;
    }

    if (newPassword.length < 8) {
      setFormError(t('settings.security.errors.min_length'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError(t('settings.security.errors.mismatch'));
      return;
    }

    if (!onChangePassword) {
      setFormError(t('settings.security.errors.unavailable'));
      return;
    }

    try {
      setFormError(null);
      await onChangePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      // The parent handles API error feedback; keep local state unchanged for retry.
    }
  };

  return (
    // <Card
    //   title="Security"
    //   subtitle="Manage your password and security"
    //   dark={dark}
    //   padding="lg"
    //   className={cardExtra(dark)}
    // >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={`block text-sm font-medium mb-2 ${label}`}>{t('settings.security.current_password')}</label>
          <Input
            type="password"
            placeholder={t('settings.security.current_password_placeholder')}
            className={input}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${label}`}>{t('settings.security.new_password')}</label>
          <Input
            type="password"
            placeholder={t('settings.security.new_password_placeholder')}
            className={input}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${label}`}>{t('settings.security.confirm_password')}</label>
          <Input
            type="password"
            placeholder={t('settings.security.confirm_password_placeholder')}
            className={input}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
          />
        </div>
        {formError && <p className="text-sm text-red-500">{formError}</p>}
        <div className="flex justify-end pt-2">
          <Button type="submit" className="rounded-xl" isLoading={isLoading}>
            <FiLock className="mr-2" />
            {t('settings.security.change_button')}
          </Button>
        </div>
      </form>
    // </Card>
  );
};

export default SecuritySettings;
