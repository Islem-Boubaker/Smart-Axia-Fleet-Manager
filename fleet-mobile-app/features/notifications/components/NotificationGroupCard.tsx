import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NotificationGroup } from '../types/notification.types';
import { NotificationRow } from './NotificationRow';

interface Props {
  group: NotificationGroup;
  onItemPress: (id: string) => void;
}

export function NotificationGroupCard({ group, onItemPress }: Props) {
  const { t } = useTranslation();

  return (
    <View className="mb-5">
      {/* Group label e.g. TODAY / YESTERDAY */}
      <Text className="text-[11px] font-bold text-gray-400 dark:text-slate-400 tracking-widest mb-2 px-1">
        {t(`notifications.groups.${group.group}`)}
      </Text>

      {/* Card containing rows */}
      <View
        className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700"
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
              <View className="h-px bg-gray-100 dark:bg-slate-700 mx-4" />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

NotificationGroupCard.displayName = 'NotificationGroupCard';
