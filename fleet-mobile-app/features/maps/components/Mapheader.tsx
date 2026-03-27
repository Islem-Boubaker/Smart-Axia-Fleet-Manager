import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface Props {
  vehicle: string;
}

export function MapHeader({ vehicle }: Props) {
  const router = useRouter();

  return (
    <SafeAreaView
      style={{ position: "absolute", top: 0, left: 0, right: 0 }}
      pointerEvents="box-none"
    >
      <View className="flex-row items-center px-4 pt-3 gap-3">
        {/* Back */}
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-white items-center justify-center"
          style={{ elevation: 4, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6 }}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={20} color="#1a1a2e" />
        </TouchableOpacity>

        {/* Vehicle pill */}
        <View
          className="flex-1 bg-white rounded-2xl px-4 py-2.5 flex-row items-center gap-2"
          style={{ elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6 }}
        >
          <MaterialIcons name="directions-car" size={16} color="#2D9B6F" />
          <Text className="text-sm font-bold text-slate-900 flex-1">{vehicle}</Text>
          <View className="bg-emerald-50 px-2 py-0.5 rounded-full">
            <Text className="text-[10px] font-bold text-emerald-700">ACTIVE</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

MapHeader.displayName = "MapHeader";