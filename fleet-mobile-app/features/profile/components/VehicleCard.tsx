import { View, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function VehicleCard({ vehicle }: any) {
  if (!vehicle) return null;

  return (
    <View className="bg-white rounded-2xl mx-5 mb-4 px-5 py-4">
      <Text className="text-[11px] font-bold text-gray-400 tracking-widest mb-3">
        MY VEHICLE
      </Text>

      <View className="flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center">
          <MaterialIcons name="directions-car" size={22} color="#2D9B6F" />
        </View>

        <View className="flex-1">
          <Text className="text-sm font-bold text-slate-900">
            {vehicle.brand} {vehicle.model}
          </Text>
          <Text className="text-xs text-gray-400">{vehicle.plate}</Text>
        </View>

        <View className="bg-emerald-50 px-2.5 py-1 rounded-full">
          <Text className="text-xs font-semibold text-emerald-700">
            {vehicle.status}
          </Text>
        </View>
      </View>
    </View>
  );
}