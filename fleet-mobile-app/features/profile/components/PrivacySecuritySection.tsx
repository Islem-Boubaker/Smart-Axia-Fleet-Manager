import React from "react";
import { Card } from "./ui/Card";
import { SectionHeader } from "./ui/SectionHeader";
import { Divider } from "./ui/Divider";
import { LinkRow } from "./ui/LinkRow";
import { ToggleRow } from "./ui/ToggleRow";
import { EyeOff, KeyRound } from "lucide-react-native";

export default function PrivacySecuritySection({ twoFA, setTwoFA }: any) {
  return (
    <>
      <SectionHeader title="Privacy & Security" />
      <Card>
        <LinkRow
          icon={<EyeOff size={16} color="#6b7280" />}
          label="Privacy"
        />
        <Divider />
        <ToggleRow
          icon={<KeyRound size={16} color="#6b7280" />}
          label="Two-Factor Authentication"
          value={twoFA}
          onToggle={() => setTwoFA((v: boolean) => !v)}
        />
      </Card>
    </>
  );
}
