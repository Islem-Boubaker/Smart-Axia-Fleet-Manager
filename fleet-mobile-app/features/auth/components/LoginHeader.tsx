import React from "react";
import { Image, Platform, Text, View } from "react-native";

function LoginHeader() {
  return (
    <View>
      {/* Title */}
      <View className="mb-10 justify-center items-center">
        <View className="mb-5 h-32 w-32 items-center justify-center rounded-[32px] bg-black p-2">
          <Image
            source={require("../../../assets/images/official-logo.png")}
            className="h-full w-full rounded-[26px]"
            resizeMode="contain"
          />
        </View>

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
