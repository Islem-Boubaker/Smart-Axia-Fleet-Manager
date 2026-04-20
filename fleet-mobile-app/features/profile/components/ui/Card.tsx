import { View } from "react-native";
export const Card = ({ children }: any) => (
  <View className="mx-4 rounded-3xl overflow-hidden bg-white border border-gray-200 dark:bg-slate-900 dark:border-slate-700 shadow-card">
    {children}
  </View>
);
