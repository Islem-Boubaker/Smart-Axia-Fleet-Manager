import { View } from "react-native";
import StatCard from "./StatCard";

export default function ReclamationStats({ countOf }: any) {
  return (
    <View className="flex-row gap-2.5 px-5 mt-2 mb-4">
      <StatCard count={countOf("pending")} label="PENDING" dotColor="#F59E0B" />
      <StatCard count={countOf("in_progress")} label="IN PROGRESS" dotColor="#3B82F6" />
      <StatCard count={countOf("resolved")} label="RESOLVED" dotColor="#10B981" />
    </View>
  );
}