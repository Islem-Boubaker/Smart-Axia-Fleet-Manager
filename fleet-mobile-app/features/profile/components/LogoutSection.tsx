import { TouchableOpacity, View, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function LogoutSection({ onLogout }: any) {
  return (
    <TouchableOpacity
      className="mx-5 bg-red-50 rounded-2xl py-4 items-center"
      onPress={onLogout}
    >
      <View className="flex-row items-center gap-2">
        <MaterialIcons name="logout" size={18} color="#E74C3C" />
        <Text className="text-sm font-bold text-red-500">Log out</Text>
      </View>
    </TouchableOpacity>
  );
}