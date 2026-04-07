import { View, Text } from "react-native";
export const SubmitButton = ({ label, onPress }: any) => (
  <View className="mx-4 mt-6">
    <Text
      onPress={onPress}
      className="text-center bg-zinc-600 text-white py-4 rounded-2xl font-semibold"
    >
      {label}
    </Text>
  </View>
);