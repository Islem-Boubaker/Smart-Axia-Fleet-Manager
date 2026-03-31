import { Switch, View, Text } from "react-native";
export const ToggleRow = ({ icon, label, value, onToggle }: any) => (
  <View className="flex-row items-center justify-between px-4 py-3.5">
    <View className="flex-row items-center gap-3">
      <View className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center">
        {icon}
      </View>
      <Text className="text-gray-900 text-sm font-medium">{label}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: "#d1d5db", true: "#d1d5db" }}
      thumbColor="#ffffff"
    />
  </View>
);
