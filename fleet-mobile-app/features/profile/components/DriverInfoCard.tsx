import { View, Text, TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

export default function DriverInfoCard({ user }: any) {
  const router = useRouter();

  return (
    <View className="bg-white rounded-2xl mx-5 mb-4 px-5 py-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-bold text-slate-900">
          {user?.name ?? "—"}
        </Text>
        <TouchableOpacity onPress={() => router.push("/profile/edit")}>
          <MaterialIcons name="edit" size={20} color="#555" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
