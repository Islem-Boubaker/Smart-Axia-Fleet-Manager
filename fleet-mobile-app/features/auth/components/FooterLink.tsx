import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export function FooterLink() {
  return (
    <View className="flex-row items-center">
      <Text className="text-sm text-gray-500">
        Remember your password?{" "}
      </Text>

      <TouchableOpacity onPress={() => router.back()}>
        <Text className="text-sm text-blue-700 font-medium">
          Sign in
        </Text>
      </TouchableOpacity>
    </View>
  );
}