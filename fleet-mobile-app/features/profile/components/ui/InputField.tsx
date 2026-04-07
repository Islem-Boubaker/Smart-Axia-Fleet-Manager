import { TextInput, View, Text } from "react-native";

export const InputField = ({ label, value, onChangeText, placeholder }: any) => (
  <View className="mb-4">
    <Text className="text-gray-500 text-xs mb-1">{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900"
    />
  </View>
);
