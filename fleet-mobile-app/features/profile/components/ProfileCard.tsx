import { View, Text, TouchableOpacity } from "react-native";
import { User } from "lucide-react-native";
import UserAvatar from "@/shared/components/ui/userAvatar";
export default function ProfileCard({ user }: any) {
  return (
    <View className="mx-4 mt-2 mb-2 rounded-2xl bg-white border border-gray-200 px-4 py-4 flex-row items-center justify-between">
      
      <View className="flex-row items-center gap-3">

        
        <UserAvatar size={15} />
        {/* User Info */}
        <View>
          <Text className="text-gray-900 text-base font-semibold">
            {user?.name || "Unknown User"}
          </Text>
          <Text className="text-gray-500 text-xs mt-0.5">
            {user?.role || "Driver"}
          </Text>
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
        <User size={15} color="#6b7280" />
      </TouchableOpacity>

    </View>
  );
}