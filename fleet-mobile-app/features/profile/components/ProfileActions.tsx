import { View, Text, Switch, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ─── Types ────────────────────────────────────────────────────────
interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
}

interface Props {
  user: any;
  notifEnabled: boolean;
  setNotifEnabled: (val: boolean) => void;
}

// ─── Single Row ───────────────────────────────────────────────────
function Row({ icon, label, value, onPress }: RowProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center px-4 py-4 bg-white rounded-2xl gap-3"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={20} color="#4B5563" />
      <Text className="flex-1 text-sm font-medium text-slate-900">{label}</Text>
      <View className="flex-row items-center gap-1.5">
        {value && <Text className="text-xs text-gray-400">{value}</Text>}
        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      </View>
    </TouchableOpacity>
  );
}

// ─── ProfileActions ───────────────────────────────────────────────
export default function ProfileActions({ user, notifEnabled, setNotifEnabled }: Props) {
  return (
    <>
      {/* Section label */}
      <Text className="text-[11px] font-bold text-gray-400 tracking-widest px-6 mb-3">
        ACCOUNT SETTING
      </Text>

      {/* bg-[#F0F5F0] container with gap between each bg-white card */}
      <View className="bg-[#F0F5F0] mx-5 mb-4 rounded-2xl gap-2 p-2">

        <Row
          icon="mail-outline"
          label="Email"
          value={user?.email}
          onPress={() => {}}
        />

        <Row
          icon="call-outline"
          label="Phone"
          value={user?.phone}
          onPress={() => {}}
        />

      
        <View className="flex-row items-center px-4 py-4 bg-white rounded-2xl gap-3">
          <Ionicons name="notifications-outline" size={20} color="#4B5563" />
          <Text className="flex-1 text-sm font-medium text-slate-900">Notification</Text>
          <Switch
            value={notifEnabled}
            onValueChange={setNotifEnabled}
            trackColor={{ false: "#E0E0E0", true: "#2D9B6F" }}
            thumbColor="#fff"
          />
        </View>

        <Row
          icon="location-outline"
          label="Saved address"
          onPress={() => {}}
        />

        <Row
          icon="language-outline"
          label="Select language"
          value={user?.language ?? "English"}
          onPress={() => {}}
        />

      </View>
    </>
  );
}