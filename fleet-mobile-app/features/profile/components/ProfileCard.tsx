import { View, Text, TouchableOpacity } from "react-native";
import { User } from "lucide-react-native";
import UserAvatar from "@/shared/components/ui/userAvatar";
export default function ProfileCard({ user }: any) {
  return (
    <View className="mx-4 mt-2 mb-2 rounded-3xl bg-white border border-gray-200 px-4 py-4 flex-row items-center justify-between dark:bg-slate-900 dark:border-slate-700 shadow-card">
      
      <View className="flex-row items-center gap-3">

        
        <UserAvatar size={15} />
        {/* User Info */}
        <View>
          <Text className="text-gray-900 text-base font-semibold dark:text-gray-100">
            {user?.name || "Unknown User"}
          </Text>
          <Text className="text-gray-500 text-xs mt-0.5 dark:text-slate-400">
            {user?.role || "Driver"}
          </Text>
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity className="w-9 h-9 rounded-2xl bg-gray-100 items-center justify-center dark:bg-slate-800">
        <User size={15} color="#6b7280" />
      </TouchableOpacity>

    </View>
  );
}
