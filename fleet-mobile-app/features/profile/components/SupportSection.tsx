import React from "react";
import { Card } from "./ui/Card";
import { SectionHeader } from "./ui/SectionHeader";
import { Divider } from "./ui/Divider";
import { LinkRow } from "./ui/LinkRow";
import {
  HelpCircle,
  AlertTriangle,
  FileText,
  Shield,
} from "lucide-react-native";

export default function SupportSection() {
  return (
    <>
      <SectionHeader title="Support" />
      <Card>
        <LinkRow
          icon={<HelpCircle size={16} color="#6b7280" />}
          label="Help Center"
        />
        <Divider />
        <LinkRow
          icon={<AlertTriangle size={16} color="#6b7280" />}
          label="Report a Problem"
        />
        <Divider />
        <LinkRow
          icon={<FileText size={16} color="#6b7280" />}
          label="Terms of Service"
        />
        <Divider />
        <LinkRow
          icon={<Shield size={16} color="#6b7280" />}
          label="Privacy Policy"
        />
      </Card>
    </>
  );
}
