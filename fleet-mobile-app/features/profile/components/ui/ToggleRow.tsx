import { Switch, View, Text } from "react-native";

type ToggleRowProps = {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
};

export const ToggleRow = ({ icon, label, value, onToggle, disabled = false }: ToggleRowProps) => (
  <View className="flex-row items-center justify-between px-4 py-3.5">
    <View className="flex-row items-center gap-3">
      <View className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center dark:bg-slate-800">
        {icon}
      </View>
      <Text className="text-gray-900 text-sm font-medium dark:text-gray-100">{label}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      disabled={disabled}
      trackColor={{ false: "#d1d5db", true: "#d1d5db" }}
      thumbColor="#ffffff"
    />
  </View>
);
