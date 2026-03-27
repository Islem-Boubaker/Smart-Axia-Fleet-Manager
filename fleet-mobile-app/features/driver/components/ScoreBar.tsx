import { View, Text } from "react-native";

const SCORE_COLOR = {
  completed: "bg-emerald-500",
  active: "bg-blue-600",
  pending: "bg-gray-200",
};

export default function ScoreBar({ score, status }: any) {
  return (
    <View className="items-center justify-end min-w-[50px]">
      <View className="w-2 h-20 bg-gray-100 rounded-full overflow-hidden mb-1">
        <View
          className={`w-full ${SCORE_COLOR[status]} rounded-full`}
          style={{ height: `${score || 0}%` }}
        />
      </View>
      <Text className="text-xs font-bold">
        {score ? `${score}%` : "N/A"}
      </Text>
      <Text className="text-[9px] text-gray-400">Score</Text>
    </View>
  );
}