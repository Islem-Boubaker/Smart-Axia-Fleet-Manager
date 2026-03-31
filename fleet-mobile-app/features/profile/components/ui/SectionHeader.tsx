import { Text } from "react-native";
export const SectionHeader = ({ title }: any) => (
  <Text className="text-xs font-semibold tracking-widest text-gray-500 uppercase px-4 pt-6 pb-2">
    {title}
  </Text>
);