import { TextInput, View, Text } from "react-native";

export const InputField = ({ label, value, onChangeText, placeholder, ...rest }: any) => (
  <View className="mb-4">
    <Text className="text-gray-500 text-[11px] font-semibold tracking-wide mb-1.5 dark:text-slate-400">{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#94A3B8"
      className="bg-gray-100 rounded-2xl px-4 py-3.5 text-gray-900 dark:bg-slate-800 dark:text-gray-100 border border-transparent focus:border-brand-500"
      {...rest}
    />
  </View>
);
