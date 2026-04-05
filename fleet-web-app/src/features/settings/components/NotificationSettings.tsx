import { FiSave } from 'react-icons/fi';
import { Card, Button } from '../../../shared/components';
import NotificationGroup from './NotificationGroup';
import type { NotificationPreferences } from '../settings.types';

const cardExtra = (dark: boolean) =>
  dark
    ? 'rounded-2xl !border-slate-700/70 !bg-slate-900/40 shadow-soft ring-1 ring-white/[0.06] backdrop-blur-md'
    : 'rounded-2xl !border-slate-200/90 !bg-white/75 shadow-glass backdrop-blur-sm';

interface Props {
  notifications: NotificationPreferences;
  onChange: (data: NotificationPreferences) => void;
  dark?: boolean;
}

const NotificationSettings = ({ notifications, onChange, dark = false }: Props) => {
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
    <Card
      title="Notifications"
      subtitle="Manage how you receive notifications"
      dark={dark}
      padding="lg"
      className={cardExtra(dark)}
    >
      <div className="space-y-8">
        <NotificationGroup
          title="Email"
          entries={emailEntries}
          prefix="email"
          onChange={handleToggle}
          dark={dark}
        />
        <NotificationGroup
          title="Push"
          entries={pushEntries}
          prefix="push"
          onChange={handleToggle}
          dark={dark}
        />
        <div className="flex justify-end">
          <Button className="rounded-xl">
            <FiSave className="mr-2" />
            Save changes
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default NotificationSettings;
