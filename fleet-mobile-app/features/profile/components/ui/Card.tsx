import { View } from "react-native";
export const Card = ({ children }: any) => (
  <View className="mx-4 rounded-2xl overflow-hidden bg-white border border-gray-200">
    {children}
  </View>
);
