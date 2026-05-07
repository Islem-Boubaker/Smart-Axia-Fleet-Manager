import { Bell, Mail } from "lucide-react-native";
import { Card } from "./ui/Card";
import { SectionHeader } from "./ui/SectionHeader";
import { Divider } from "./ui/Divider";
import { ToggleRow } from "./ui/ToggleRow";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  return (
    <>
      <SectionHeader title={t("profile.notifications.title")} />
      <Card>
        <ToggleRow
          icon={<Bell size={16} color="#6b7280" />}
          label={t("profile.notifications.push")}
          value={pushNotif}
          onToggle={onTogglePush}
          disabled={disabled}
        />
        <Divider />
        <ToggleRow
          icon={<Mail size={16} color="#6b7280" />}
          label={t("profile.notifications.email")}
          value={emailUpdates}
          onToggle={onToggleEmail}
          disabled={disabled}
        />
      </Card>
    </>
  );
}
