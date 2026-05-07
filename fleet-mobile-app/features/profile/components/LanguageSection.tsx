import { Languages } from "lucide-react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Card } from "./ui/Card";
import { SectionHeader } from "./ui/SectionHeader";
import { LinkRow } from "./ui/LinkRow";
import type { SupportedLang } from "@/i18n";

export default function LanguageSection() {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language ?? "fr") as SupportedLang;
  const langLabel = t(`profile.language.${currentLang}`);

  return (
    <>
      <SectionHeader title={t("profile.language.sectionTitle")} />
      <Card>
        <LinkRow
          onPress={() => router.push("/profile/language")}
          icon={<Languages size={16} color="#6b7280" />}
          label={t("profile.language.title")}
          subtitle={langLabel}
        />
      </Card>
    </>
  );
}
