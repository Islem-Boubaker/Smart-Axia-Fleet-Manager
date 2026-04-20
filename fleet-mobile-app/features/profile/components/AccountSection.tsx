import { User, Lock, Mail } from "lucide-react-native";
import {  Card } from "./ui/Card";
import { SectionHeader } from "./ui/SectionHeader";
import {Divider} from "./ui/Divider";
import { LinkRow } from "./ui/LinkRow";
import { router } from "expo-router";

export default function AccountSection() {
  return (
    <>
      <SectionHeader title="Account" />
      <Card>
        <LinkRow onPress={() => router.push("/profile/edit")} icon={<User size={16} color="#6b7280" />} label="Edit Profile" />
        <Divider />
        <LinkRow onPress={() => router.push("/profile/change-password")} icon={<Lock size={16} color="#6b7280" />} label="Change Password" />
        {/* Email notifications removed per request */}
      </Card>
    </>
  );
}