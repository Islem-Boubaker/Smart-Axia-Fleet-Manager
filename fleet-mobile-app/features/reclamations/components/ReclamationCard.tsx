import { View, Text, TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAppTheme } from "@/shared/theme/ThemeProvider";

export default function ReclamationCard({ item, config, typeConfig, onPress }: any) {
  const { isDark } = useAppTheme();
  const st = config[item.status];
  const typ = typeConfig[item.type];

  return (
    <TouchableOpacity
      className="bg-white dark:bg-slate-900 rounded-3xl p-4 mb-3 border border-gray-100 dark:border-slate-700"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: st.borderColor,
        elevation: 4,
        shadowColor: "#0F172A",
        shadowOpacity: isDark ? 0.28 : 0.09,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      }}
      onPress={onPress}
    >
      <View className="flex-row justify-between mb-2">
        <Text className="font-bold flex-1 text-gray-900 dark:text-gray-50">{item.title}</Text>

        <View className={`px-2.5 py-1 rounded-full ${st.badgeClass}`}>
          <Text className={`${st.textClass}`}>{st.label}</Text>
        </View>
      </View>

      <Text className="text-xs text-gray-500 dark:text-slate-400 mb-3" numberOfLines={2}>
        {item.description}
      </Text>

      <View className="flex-row justify-between">
        <Text className="text-xs text-gray-400 dark:text-slate-400">{item.date}</Text>

        <View className="flex-row items-center bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
          <MaterialIcons name={typ.icon} size={12} color={isDark ? "#CBD5E1" : "#374151"} />
          <Text className="text-xs ml-1 text-gray-700 dark:text-slate-300">{typ.label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
