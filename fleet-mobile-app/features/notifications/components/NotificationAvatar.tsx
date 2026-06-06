import React from "react";
import { View } from "react-native";
import type { NotificationType } from "../types/notification.types";
import { TYPE_CONFIG } from "./typeConfig";

interface Props {
  type: NotificationType;
}

export function NotificationAvatar({ type }: Props) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.system;
  const { Icon, iconColor, bgClass, darkBgClass } = cfg;

  return (
    <View className={`w-11 h-11 rounded-full items-center justify-center ${bgClass} ${darkBgClass}`}>
      <Icon size={20} color={iconColor} strokeWidth={2} />
    </View>
  );
}

NotificationAvatar.displayName = "NotificationAvatar";
