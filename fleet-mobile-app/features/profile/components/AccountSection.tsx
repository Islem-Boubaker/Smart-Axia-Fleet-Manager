import { User, Lock } from "lucide-react-native";
import { Card } from "./ui/Card";
import { SectionHeader } from "./ui/SectionHeader";
import { Divider } from "./ui/Divider";
import { LinkRow } from "./ui/LinkRow";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

export default function AccountSection() {
  const { t } = useTranslation();

  return (
    <>
      <SectionHeader title={t("profile.account")} />
      <Card>
        <LinkRow onPress={() => router.push("/profile/edit")} icon={<User size={16} color="#6b7280" />} label={t("profile.editProfile")} />
        <Divider />
        <LinkRow onPress={() => router.push("/profile/change-password")} icon={<Lock size={16} color="#6b7280" />} label={t("profile.changePassword")} />
      </Card>
    </>
  );
}
