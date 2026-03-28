import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { NotificationItem } from '../types/notification.types';
import { NotificationAvatar } from './NotificationAvatar';

interface Props {
  item: NotificationItem;
  onPress: (id: string) => void;
}

export function NotificationRow({ item, onPress }: Props) {
  return (
    <TouchableOpacity
      className={`flex-row items-center px-4 py-3.5 gap-3 ${
        item.unread ? 'bg-emerald-50/40' : 'bg-white'
      }`}
      onPress={() => onPress(item.id)}
      activeOpacity={0.75}
    >
      {/* Icon avatar */}
      <NotificationAvatar type={item.type} />

      {/* Text body */}
      <View className="flex-1">
        <Text
          className={`text-[13px] text-slate-900 mb-0.5 ${
            item.unread ? 'font-bold' : 'font-medium'
          }`}
        >
          {item.name}
        </Text>
        <Text className="text-xs text-gray-500 leading-[17px]" numberOfLines={2}>
          {item.message}
        </Text>
      </View>

      {/* Time + unread indicator */}
      <View className="items-end gap-1.5 min-w-[40px]">
        <Text className="text-[11px] text-gray-400 font-medium">{item.time}</Text>
        {item.unread && (
          <View className="w-2 h-2 rounded-full bg-red-500" />
        )}
      </View>
    </TouchableOpacity>
  );
}

NotificationRow.displayName = 'NotificationRow';