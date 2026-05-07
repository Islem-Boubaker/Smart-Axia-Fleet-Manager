import { useTranslation } from "react-i18next";
import { SectionHeader } from "./ui/SectionHeader";
import { ToggleRow } from "./ui/ToggleRow";
import { Card } from "./ui/Card";
import { Moon } from "lucide-react-native";

export default function PreferenceSection({
  darkMode,
  setDarkMode,
}: {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <SectionHeader title={t("profile.preferences.title")} />
      <Card>
        <ToggleRow
          icon={<Moon size={16} color="#6b7280" />}
          label={t("profile.preferences.darkMode")}
          value={darkMode}
          onToggle={setDarkMode}
        />
      </Card>
    </>
  );
}
