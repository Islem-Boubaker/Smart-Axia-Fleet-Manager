import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

export const SubmitButton = ({ label, onPress, disabled = false, loading = false }: any) => (
  <View className="mx-4 mt-6">
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`py-4 rounded-2xl ${disabled ? "bg-brand-500/40" : "bg-brand-600"} shadow-float`}
      activeOpacity={0.85}
    >
      {loading ? (
        <View className="flex-row items-center justify-center gap-2">
          <ActivityIndicator size="small" color="#ffffff" />
          <Text className="text-white font-bold tracking-[0.2px]">{label}</Text>
        </View>
      ) : (
        <Text className="text-center text-white font-bold tracking-[0.2px]">{label}</Text>
      )}
    </TouchableOpacity>
  </View>
);
