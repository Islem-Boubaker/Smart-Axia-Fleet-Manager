import { View, Text, TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function ReclamationCard({ item, config, typeConfig, onPress }: any) {
  const st = config[item.status];
  const typ = typeConfig[item.type];

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 mb-3"
      style={{ borderLeftWidth: 4, borderLeftColor: st.borderColor }}
      onPress={onPress}
    >
      <View className="flex-row justify-between mb-2">
        <Text className="font-bold flex-1">{item.title}</Text>

        <View className={`px-2.5 py-1 rounded-full ${st.badgeClass}`}>
          <Text className={`${st.textClass}`}>{st.label}</Text>
        </View>
      </View>

      <Text className="text-xs text-gray-500 mb-3" numberOfLines={2}>
        {item.description}
      </Text>

      <View className="flex-row justify-between">
        <Text className="text-xs text-gray-400">{item.date}</Text>

        <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded-lg">
          <MaterialIcons name={typ.icon} size={12} />
          <Text className="text-xs ml-1">{typ.label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}