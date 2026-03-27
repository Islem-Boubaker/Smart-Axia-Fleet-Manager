import { useState, useCallback } from 'react';
import type { NotificationGroup } from '../types/notification.types';
import { notificationApi } from '../services/notification.api';

// ─── Fallback mock data (used until API is ready) ─────────────────
const MOCK_DATA: NotificationGroup[] = [
  {
    group: 'TODAY',
    items: [
      { id: '1', name: 'Trip assigned',     message: 'Route Tunis → Sfax has been assigned to you',        time: '15.14', type: 'trip',     unread: true  },
      { id: '2', name: 'Schedule update',   message: 'Your 14:00 departure has been rescheduled to 14:30', time: '14.31', type: 'schedule', unread: true  },
      { id: '3', name: 'Reclamation',       message: 'Your vehicle damage report is under review',         time: '13.12', type: 'claim',    unread: false },
    ],
  },
  {
    group: 'YESTERDAY',
    items: [
      { id: '4', name: 'Trip completed',    message: 'Trip #1929120 marked as completed. Score: 90%',      time: '22.14', type: 'trip',     unread: false },
      { id: '5', name: 'Admin message',     message: 'Please submit your fuel log for March 14',           time: '21.31', type: 'admin',    unread: false },
      { id: '6', name: 'Maintenance alert', message: 'Vehicle Toyota 9382 is due for inspection',          time: '21.12', type: 'alert',    unread: false },
      { id: '7', name: 'Trip assigned',     message: 'New trip added to your schedule for tomorrow',       time: '20.11', type: 'trip',     unread: false },
      { id: '8', name: 'Reclamation',       message: 'Your late arrival report has been resolved',         time: '20.01', type: 'claim',    unread: false },
      { id: '9', name: 'Schedule update',   message: 'Weekly schedule for Mar 17–21 is now available',     time: '19.58', type: 'schedule', unread: false },
    ],
  },
];

export function useNotification() {
  const [groups, setGroups] = useState<NotificationGroup[]>(MOCK_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Fetch from API and replace local state */
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationApi.getAll();
      setGroups(data);
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  /** Optimistic mark-one-read */
  const markRead = useCallback(async (id: string) => {
    // Optimistic update
    setGroups(prev =>
      prev.map(g => ({
        ...g,
        items: g.items.map(item =>
          item.id === id ? { ...item, unread: false } : item
        ),
      }))
    );
    try {
      await notificationApi.markRead(id);
    } catch {
      // Revert on failure — re-fetch
      fetchNotifications();
    }
  }, [fetchNotifications]);

  /** Optimistic mark-all-read */
  const markAllRead = useCallback(async () => {
    setGroups(prev =>
      prev.map(g => ({
        ...g,
        items: g.items.map(item => ({ ...item, unread: false })),
      }))
    );
    try {
      await notificationApi.markAllRead();
    } catch {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const unreadCount = groups
    .flatMap(g => g.items)
    .filter(i => i.unread).length;

  return { groups, loading, error, unreadCount, fetchNotifications, markRead, markAllRead };
}