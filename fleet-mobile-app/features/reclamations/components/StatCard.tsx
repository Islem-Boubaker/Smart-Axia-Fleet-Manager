import { View, Text } from "react-native";

export default function StatCard({ count, label, dotColor }: any) {
  return (
    <View className="flex-1 bg-white dark:bg-slate-900 rounded-2xl px-3.5 py-3 border border-gray-100 dark:border-slate-700">
      <View
        className="w-2 h-2 rounded-full mb-1.5"
        style={{ backgroundColor: dotColor }}
      />
      <Text className="text-xl font-extrabold text-slate-900 dark:text-gray-50">{count}</Text>
      <Text className="text-[10px] font-semibold text-gray-400 dark:text-slate-400 mt-0.5">
        {label}
      </Text>
    </View>
  );
}