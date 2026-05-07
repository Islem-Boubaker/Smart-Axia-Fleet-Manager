import React from 'react';
import { I18nManager, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from "@/shared/theme/ThemeProvider";

interface Props {
  onMarkAllRead: () => void;
  unreadCount: number;
}

export function NotificationHeader({ onMarkAllRead, unreadCount }: Props) {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center justify-between bg-white dark:bg-slate-900 px-5 py-3.5 border-b border-gray-100 dark:border-slate-700">

      {/* Back button */}
      <TouchableOpacity onPress={() => router.back()} className="w-8 items-start">
        <MaterialIcons name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} size={22} color={isDark ? "#F8FAFC" : "#1a1a2e"} />
      </TouchableOpacity>

      {/* Title + bell icon + unread badge */}
      <View className="flex-row items-center gap-2 flex-1 justify-center">
        
        <Text className="text-[17px] font-bold text-slate-900 dark:text-gray-50">{t("notifications.title")}</Text>
        {unreadCount > 0 && (
          <View className="bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1">
            <Text className="text-white text-[10px] font-bold">{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Mark all read */}
      <TouchableOpacity
        onPress={onMarkAllRead}
        disabled={unreadCount === 0}
        className="w-8 items-end"
      >
        <MaterialIcons
          name="done-all"
          size={20}
          color={unreadCount > 0 ? '#2D9B6F' : isDark ? '#475569' : '#D1D5DB'}
        />
      </TouchableOpacity>

    </View>
  );
}

NotificationHeader.displayName = 'NotificationHeader';
