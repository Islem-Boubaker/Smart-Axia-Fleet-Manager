import React from "react";
import { Image, Text, View } from "react-native";
import { useSelector } from "react-redux";

type AvatarSize = number | { width: number; height: number };

interface UserAvatarProps {
  size?: AvatarSize;
}

const toPixels = (value: number): number => value * 4;

const normalizeSize = (size?: AvatarSize): { width: number; height: number } => {
  if (typeof size === "number") {
    const px = toPixels(size);
    return { width: px, height: px };
  }

  if (size && typeof size === "object") {
    return {
      width: toPixels(size.width),
      height: toPixels(size.height),
    };
  }

  return { width: 56, height: 56 };
};

const UserAvatar = ({ size }: UserAvatarProps) => {
  const user = useSelector((state: any) => state.auth.user);
  const avatarSize = normalizeSize(size);
  const initialFontSize = Math.max(14, Math.round(Math.min(avatarSize.width, avatarSize.height) * 0.35));

  return (
    <View
      className="rounded-full bg-emerald-100 border-2 border-white items-center justify-center overflow-hidden"
      style={{ width: avatarSize.width, height: avatarSize.height }}
    >
      {user?.avatar ? (
        <Image
          source={{ uri: user.avatar }}
          className="w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <Text className="text-blue-600 font-bold" style={{ fontSize: initialFontSize }}>
          {user?.name?.[0] || "U"}
        </Text>
      )}
    </View>
  );
};

export default UserAvatar;
