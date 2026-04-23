import { View} from "react-native";

export const FormCard = ({ children }: any) => (
  <View className="mx-4 mt-4 bg-white border border-gray-200 rounded-3xl p-5 dark:bg-slate-900 dark:border-slate-700 shadow-card">
    {children}
  </View>
);


