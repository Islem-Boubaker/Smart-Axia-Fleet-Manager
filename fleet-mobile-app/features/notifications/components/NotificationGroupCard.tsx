import React from 'react';
import { View, Text } from 'react-native';
import type { NotificationGroup } from '../types/notification.types';
import { NotificationRow } from './NotificationRow';

interface Props {
  group: NotificationGroup;
  onItemPress: (id: string) => void;
}

export function NotificationGroupCard({ group, onItemPress }: Props) {
  return (
    <View className="mb-5">
      {/* Group label e.g. TODAY / YESTERDAY */}
      <Text className="text-[11px] font-bold text-gray-400 tracking-widest mb-2 px-1">
        {group.group}
      </Text>

      {/* Card containing rows */}
      <View
        className="bg-white rounded-2xl overflow-hidden"
        style={{
          elevation: 1,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        {group.items.map((item, idx) => (
          <React.Fragment key={item.id}>
            <NotificationRow item={item} onPress={onItemPress} />
            {/* Divider between rows (not after last) */}
            {idx < group.items.length - 1 && (
              <View className="h-px bg-gray-100 mx-4" />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

NotificationGroupCard.displayName = 'NotificationGroupCard';