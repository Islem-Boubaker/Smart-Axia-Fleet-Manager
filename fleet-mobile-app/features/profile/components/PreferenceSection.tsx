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
      </Card>
    </>
  );
}
