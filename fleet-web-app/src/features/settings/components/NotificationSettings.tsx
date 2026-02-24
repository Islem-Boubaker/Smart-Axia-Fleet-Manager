import { FiSave } from 'react-icons/fi';
import { Card, Button } from '../../../shared/components';
import NotificationGroup from './NotificationGroup';
import type { NotificationPreferences } from '../settings.types';

interface Props {
  notifications: NotificationPreferences;
  onChange: (data: NotificationPreferences) => void;
}

const NotificationSettings = ({ notifications, onChange }: Props) => {
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
    <Card title="Notification Preferences" subtitle="Manage how you receive notifications">
      <div className="space-y-6">
        <NotificationGroup
          title="Email Notifications"
          entries={emailEntries}
          prefix="email"
          onChange={handleToggle}
        />
        <NotificationGroup
          title="Push Notifications"
          entries={pushEntries}
          prefix="push"
          onChange={handleToggle}
        />
        <div className="flex justify-end">
          <Button>
            <FiSave className="mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default NotificationSettings;
