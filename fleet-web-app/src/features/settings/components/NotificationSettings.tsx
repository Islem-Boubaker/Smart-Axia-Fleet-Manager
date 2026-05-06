import { FiSave } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/components';
import NotificationGroup from './NotificationGroup';
import type { NotificationPreferences } from '../settings.types';


interface Props {
  notifications: NotificationPreferences;
  onChange: (data: NotificationPreferences) => void;
  onSave: () => Promise<void>;
  isSaving?: boolean;
  dark?: boolean;
}

const NotificationSettings = ({ notifications, onChange, onSave, isSaving = false, dark = false }: Props) => {
  const { t } = useTranslation();
  const handleToggle = (key: string, checked: boolean) => {
    onChange({ ...notifications, [key]: checked });
  };

  const emailEntries = Object.entries(notifications).filter(([key]) =>
    key.startsWith('email'),
  ) as [string, boolean][];

  const pushEntries = Object.entries(notifications).filter(([key]) =>
    key.startsWith('push'),
  ) as [string, boolean][];

  return (
    // <Card
    //   title="Notifications"
    //   subtitle="Manage how you receive notifications"
    //   dark={dark}
    //   padding="lg"
    //   className={cardExtra(dark)}
    // >
      <div className="space-y-8">
        <NotificationGroup
          title={t('settings.notifications.email')}
          entries={emailEntries}
          prefix="email"
          onChange={handleToggle}
          dark={dark}
        />
        <NotificationGroup
          title={t('settings.notifications.push')}
          entries={pushEntries}
          prefix="push"
          onChange={handleToggle}
          dark={dark}
        />
        <div className="flex justify-end">
          <Button className="rounded-xl" onClick={onSave} isLoading={isSaving}>
            <FiSave className="mr-2" />
            {t('settings.notifications.save')}
          </Button>
        </div>
      </div>
    // </Card>
  );
};

export default NotificationSettings;
