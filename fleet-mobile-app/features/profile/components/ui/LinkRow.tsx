import { TouchableOpacity, View,Text} from "react-native";
import { ChevronRight } from "lucide-react-native";
export const LinkRow = ({ icon, label, subtitle, onPress, danger }: any) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center justify-between px-4 py-3.5"
  >
    <View className="flex-row items-center gap-3 flex-1">
      <View className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center">
        {icon}
      </View>
      <View>
        <Text    className={`text-sm font-medium ${danger ? "text-red-500" : "text-gray-900"}`}>
          {label}
        </Text>
        {subtitle && <Text className="text-xs text-gray-500">{subtitle}</Text>}
      </View>
    </View>
    <ChevronRight size={16} color="#9ca3af" />
  </TouchableOpacity>
);