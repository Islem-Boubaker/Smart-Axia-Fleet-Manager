import React from "react";
import { Info, Star } from "lucide-react-native";
import { Card } from "./ui/Card";
import { SectionHeader } from "./ui/SectionHeader";
import { Divider } from "./ui/Divider";
import { LinkRow } from "./ui/LinkRow";
export default function AboutSection() {
  return (
    <>
      <SectionHeader title="About" />
      <Card>
        
        <LinkRow
          icon={<Info size={16} color="#6b7280" />}
          label="App Version"
          subtitle="1.0.0"
        />
        <Divider />
        <LinkRow
          icon={<Star size={16} color="#6b7280" />}
          label="Rate the App"
        />
      </Card>
    </>
  );
}
