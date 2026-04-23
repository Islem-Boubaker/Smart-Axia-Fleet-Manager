import { Text } from "react-native";
export const SectionHeader = ({ title }: any) => (
  <Text className="text-[11px] font-bold tracking-[1.1px] text-gray-500 uppercase px-4 pt-6 pb-2 dark:text-slate-400">
    {title}
  </Text>
);
