import { View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function ProfileHeader() {
  return (
    <View className="items-center pt-2 pb-5">
      <View className="w-[90px] h-[90px] rounded-full bg-emerald-100 items-center justify-center border-[3px] border-white shadow-md">
        <MaterialIcons name="person" size={50} color="#2D9B6F" />
      </View>
    </View>
  );
}