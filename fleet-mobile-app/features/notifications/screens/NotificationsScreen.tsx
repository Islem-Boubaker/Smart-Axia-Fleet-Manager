import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { useSelector } from 'react-redux'
import { useNotification } from '../hooks/useNotification'
import { NotificationRow } from '../components/NotificationRow'
import type { Notification, NotificationGroup } from '../types/notification.types'
import { GROUP_CONFIG } from '../types/notification.types'
import type { RootState } from '../../../store'

type ViewMode = 'all' | 'grouped'

const GROUPS: NotificationGroup[] = ['trip', 'maintenance', 'ai', 'driver', 'system']

export default function NotificationsScreen() {
  const authToken = useSelector((s: RootState & { auth?: { token?: string } }) => s.auth?.token ?? null)
  const userId = useSelector((s: RootState & { auth?: { user?: { id?: string } } }) => s.auth?.user?.id ?? null)

  const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead } =
    useNotification({ userId: userId ?? null, token: authToken, onNew: () => {} })

  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [groupFilter, setGroupFilter] = useState<NotificationGroup | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const filtered = notifications.filter((n) => {
    if (groupFilter && n.group !== groupFilter) return false
    return true
  })

  const groupedData = GROUPS.reduce((acc, group) => {
    const items = notifications.filter((n) => n.group === group)
    if (items.length) acc[group] = items
    return acc
  }, {} as Record<NotificationGroup, Notification[]>)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 800)
  }, [])

  const renderItem = ({ item }: { item: Notification }) => (
    <NotificationRow notification={item} onPress={() => markAsRead(item.id)} />
  )

  const groupedList = GROUPS.flatMap((group) => groupedData[group] ?? [])

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pb-2 border-b border-gray-200">
        <View className="flex-row justify-between items-center px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-gray-900">Notifications</Text>

          <View className="flex-row items-center gap-3">
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: isConnected ? '#10B981' : '#EF4444' }}
            />

            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={() => markAllAsRead()}
                className="px-3 py-1.5 bg-blue-50 rounded-lg"
              >
                <Text className="text-xs text-blue-500 font-semibold">
                  Mark all read
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Mode toggle */}
        <View className="flex-row mx-4 bg-gray-100 rounded-lg p-0.5 mb-2">
          {(['all', 'grouped'] as ViewMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => setViewMode(mode)}
              className={`flex-1 py-1.5 items-center rounded-md ${
                viewMode === mode ? 'bg-white shadow' : ''
              }`}
            >
              <Text
                className={`text-sm ${
                  viewMode === mode
                    ? 'text-gray-900 font-bold'
                    : 'text-gray-500 font-medium'
                }`}
              >
                {mode === 'all' ? 'All' : 'Grouped'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Group filters */}
        {viewMode === 'all' && (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[null, ...GROUPS]}
            keyExtractor={(g) => g ?? 'all'}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item: g }) => {
              const cfg = g ? GROUP_CONFIG[g] : null
              const active = groupFilter === g

              return (
                <TouchableOpacity
                  onPress={() => setGroupFilter(g)}
                  className="px-3 py-1.5 rounded-full mr-2 bg-gray-100"
                  style={active ? { backgroundColor: cfg?.color ?? '#3B82F6' } : undefined}
                >
                  <Text
                    className={`text-sm font-medium ${
                      active ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {g ? `${cfg?.icon} ${cfg?.label}` : 'All'}
                  </Text>
                </TouchableOpacity>
              )
            }}
          />
        )}
      </View>

      {/* Content */}
      {viewMode === 'all' ? (
        <FlatList
          data={filtered}
          keyExtractor={(n) => n.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="items-center pt-16">
              <Text className="text-5xl mb-3">🔔</Text>
              <Text className="text-gray-500 text-base">
                No notifications
              </Text>
            </View>
          }
          contentContainerStyle={
            filtered.length === 0 ? { flex: 1 } : undefined
          }
        />
      ) : (
        <FlatList
          data={groupedList}
          keyExtractor={(n) => n.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  )
}