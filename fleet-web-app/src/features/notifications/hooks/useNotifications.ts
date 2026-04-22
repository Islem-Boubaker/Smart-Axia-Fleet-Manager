import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import notificationApi, {
  type NotificationFilters,
  type NotificationRecord,
} from '../services/notification.api'
import { queryKeys } from '../../../shared/services/queryKeys'

export const useNotifications = (filters: NotificationFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: () => notificationApi.getAll(filters),
  })
}

export const useGroupedNotifications = (filters: NotificationFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.notifications.grouped(),
    queryFn: () => notificationApi.getAll(filters),
    select: (items) => {
      const source = Array.isArray(items) ? (items as NotificationRecord[]) : []
      return source.reduce<Record<string, NotificationRecord[]>>((acc, item) => {
        const group = item.group || 'other'
        if (!acc[group]) acc[group] = []
        acc[group].push(item)
        return acc
      }, {})
    },
  })
}

export const useUnreadCount = () => {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationApi.getUnreadCount(),
  })
}

export const useMarkAsRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (group?: string) => notificationApi.markAllAsRead(group),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}

export const useArchiveNotification = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })
}

export const useDeleteNotification = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })
}
