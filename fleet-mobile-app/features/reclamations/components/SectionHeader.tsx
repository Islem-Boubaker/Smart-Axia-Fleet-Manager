import { View, Text, TouchableOpacity } from "react-native";

export default function SectionHeader({ onViewAll }: any) {
  return (
    <View className="flex-row justify-between items-center px-5 mb-2">
      <Text className="text-sm font-bold text-gray-700 dark:text-slate-200">
        Recent reclamations
      </Text>

      <TouchableOpacity onPress={onViewAll}>
        <Text className="text-xs text-emerald-600 font-semibold">
          View all
        </Text>
      </TouchableOpacity>
    </View>
  );
}