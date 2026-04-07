import { Bell, Mail } from "lucide-react-native";
import {  Card } from "./ui/Card";
import { SectionHeader } from "./ui/SectionHeader";
import {Divider} from "./ui/Divider";

import { ToggleRow } from "./ui/ToggleRow";

export default function NotificationsSection({ pushNotif, setPushNotif, emailUpdates, setEmailUpdates }: any) {
  return (
    <>
      <SectionHeader title="Notifications" />
      <Card>
        <ToggleRow
          icon={<Bell size={16} color="#6b7280" />}
          label="Push Notifications"
          value={pushNotif}
          onToggle={() => setPushNotif((v: boolean) => !v)}
        />
        <Divider />
        <ToggleRow
          icon={<Mail size={16} color="#6b7280" />}
          label="Email Updates"
          value={emailUpdates}
          onToggle={() => setEmailUpdates((v: boolean) => !v)}
        />
      </Card>
    </>
  );
}