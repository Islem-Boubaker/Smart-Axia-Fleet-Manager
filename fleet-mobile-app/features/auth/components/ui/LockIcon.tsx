import { View } from "react-native";
import Svg, { Rect, Path } from "react-native-svg";

export function LockIcon() {
  return (
    <View className="w-14 h-14 rounded-full bg-blue-100 items-center justify-center mb-5">
      <Svg
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#378ADD"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Rect x="3" y="11" width="18" height="11" rx="2" />
        <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </Svg>
    </View>
  );
}
