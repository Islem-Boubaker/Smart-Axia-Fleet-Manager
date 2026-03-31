import { SectionHeader } from "./ui/SectionHeader";
import { ToggleRow } from "./ui/ToggleRow";
import { Card } from "./ui/Card";
import { Divider } from "./ui/Divider";
import { LinkRow } from "./ui/LinkRow";
import { Moon, Globe } from "lucide-react-native";
import { router } from "expo-router";

export default function PreferenceSection({
  darkMode,
  setDarkMode,
}: {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
}) {
  return (
    <>
      <SectionHeader title="Preferences" />
      <Card>
        <ToggleRow
          icon={<Moon size={16} color="#6b7280" />}
          label="Dark Mode"
          value={darkMode}
          onToggle={() => setDarkMode(!darkMode)}
        />
        <Divider />{" "}
        <LinkRow
          onPress={() => router.push("/profile/language")}
          icon={<Globe size={16} color="#6b7280" />}
          label="Language"
          subtitle="English"
        />
      </Card>
    </>
  );
}
