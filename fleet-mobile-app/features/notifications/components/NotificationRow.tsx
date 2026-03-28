import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import type { Notification } from '../types/notification.types'
import { GROUP_CONFIG, PRIORITY_CONFIG } from '../types/notification.types'

interface Props {
  notification: Notification
  onPress: () => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function NotificationRow({ notification: n, onPress }: Props) {
  const grpCfg = GROUP_CONFIG[n.group]
  const priCfg = PRIORITY_CONFIG[n.priority]
  const isUnread = !n.read_at

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row p-4 gap-3 border-b border-gray-100 ${isUnread ? 'bg-blue-50' : 'bg-white'}`}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center shrink-0"
        style={{ backgroundColor: grpCfg.bgColor }}
      >
        <Text className="text-lg">{grpCfg.icon}</Text>
      </View>

      <View className="flex-1">
        <View className="flex-row justify-between items-start mb-0.5">
          <Text
            numberOfLines={1}
            className={`text-sm flex-1 mr-2 ${
              isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
            }`}
          >
            {n.title}
          </Text>
          <Text className="text-[11px] text-gray-400 shrink-0">
            {timeAgo(n.created_at)}
          </Text>
        </View>

        <Text numberOfLines={2} className="text-xs text-gray-500 leading-4 mb-1.5">
          {n.message}
        </Text>

        <View className="flex-row gap-1.5">
          <View
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: grpCfg.color + '20' }}
          >
            <Text
              className="text-[10px] font-semibold"
              style={{ color: grpCfg.color }}
            >
              {grpCfg.label}
            </Text>
          </View>

          {(n.priority === 'high' || n.priority === 'critical') && (
            <View
              className="px-2 py-0.5 rounded-full"
              style={{ backgroundColor: priCfg.color + '20' }}
            >
              <Text
                className="text-[10px] font-semibold"
                style={{ color: priCfg.color }}
              >
                {priCfg.label}
              </Text>
            </View>
          )}
        </View>
      </View>

      {isUnread && (
        <View className="w-2 h-2 rounded-full bg-blue-500 self-center shrink-0" />
      )}
    </TouchableOpacity>
  )
}