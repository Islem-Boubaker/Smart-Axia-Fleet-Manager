import { Bell, Mail } from "lucide-react-native";
import {  Card } from "./ui/Card";
import { SectionHeader } from "./ui/SectionHeader";
import {Divider} from "./ui/Divider";

import { ToggleRow } from "./ui/ToggleRow";

type NotificationsSectionProps = {
  pushNotif: boolean;
  emailUpdates: boolean;
  onTogglePush: (value: boolean) => void;
  onToggleEmail: (value: boolean) => void;
  disabled?: boolean;
};

export default function NotificationsSection({
  pushNotif,
  emailUpdates,
  onTogglePush,
  onToggleEmail,
  disabled = false,
}: NotificationsSectionProps) {
  return (
    <>
      <SectionHeader title="Notifications" />
      <Card>
        <ToggleRow
          icon={<Bell size={16} color="#6b7280" />}
          label="Push Notifications"
          value={pushNotif}
          onToggle={onTogglePush}
          disabled={disabled}
        />
        <Divider />
        <ToggleRow
          icon={<Mail size={16} color="#6b7280" />}
          label="Email Updates"
          value={emailUpdates}
          onToggle={onToggleEmail}
          disabled={disabled}
        />
      </Card>
    </>
  );
}