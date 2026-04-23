import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

export function EnvelopeIcon() {
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
        <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <Path d="m22 6-10 7L2 6" />
      </Svg>
    </View>
  );
}
