import React from 'react';
import { View, Text } from 'react-native';
import type { NotificationType } from '../types/notification.types';
import { TYPE_CONFIG } from './typeConfig';

interface Props {
  type: NotificationType;
}

export function NotificationAvatar({ type }: Props) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.admin;
  return (
    <View className={`w-11 h-11 rounded-full items-center justify-center ${cfg.bgClass}`}>
      <Text className="text-xl">{cfg.emoji}</Text>
    </View>
  );
}

NotificationAvatar.displayName = 'NotificationAvatar';