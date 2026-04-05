import { View, Text, TouchableOpacity } from "react-native";

export default function TaskCard({ task, isCurrent, onPress }: any) {
  return (
    <TouchableOpacity
      className={`flex-1 rounded-2xl p-4 ${
        isCurrent ? "bg-emerald-600" : "bg-white border border-gray-200"
      }`}
      onPress={onPress}
    >
      <Text
        className={`text-[9px] font-bold mb-1 ${
          isCurrent ? "text-white/70" : "text-emerald-600"
        }`}
      >
        {isCurrent ? "CURRENT TASK" : "UPCOMING TASK"}
      </Text>

      <Text
        className={`text-lg font-bold ${
          isCurrent ? "text-white" : "text-gray-900"
        }`}
      >
        {task.vehicle}
      </Text>

      <Text
        className={`text-xs mb-3 ${
          isCurrent ? "text-white/70" : "text-gray-400"
        }`}
      >
        {task.timeLeft}
      </Text>

      <View
        className={`rounded-lg py-2 items-center ${
          isCurrent ? "bg-white/20" : "bg-gray-100"
        }`}
      >
        <Text
          className={`text-xs font-semibold ${
            isCurrent ? "text-white" : "text-gray-900"
          }`}
        >
          Task details
        </Text>
      </View>
    </TouchableOpacity>
  );
}