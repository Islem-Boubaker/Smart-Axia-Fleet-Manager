import React from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import Svg, { G, Path } from "react-native-svg";

function LoginHeader({
  handleGoogle,
  handleApple,
  isLoading,
}: {
  handleGoogle?: () => void;
  handleApple?: () => void;
  isLoading?: boolean;
}) {
  return (
    <View>
      {/* Title */}
      <View className="mb-10 justify-center items-center">
        <Text
          className="text-[28px] font-extrabold text-[#1A1233] tracking-tight mb-3"
          style={{ fontFamily: Platform.OS === "ios" ? "Georgia" : "serif" }}
        >
          Sign In
        </Text>

        <Text className="text-[13.5px] text-[#8E8BA8] mt-1.5">
          Hi! Welcome back. Please sign in to continue.
        </Text>
      </View>
    </View>
  );
}

LoginHeader.displayName = "LoginHeader";

export default LoginHeader;
