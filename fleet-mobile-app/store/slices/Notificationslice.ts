import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Notification, NotificationGroup }         from '../../features/notifications/types/notification.types';
import { notificationApi }             from '../../features/notifications/services/notification.api';



export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (params: Record<string, string> = {}) => notificationApi.getAll(params)
);

export const fetchGrouped = createAsyncThunk(
  'notifications/fetchGrouped',
  async () => notificationApi.getGrouped()
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchCount',
  async () => notificationApi.getUnreadCount()
);

// ─── State ────────────────────────────────────────────────────────────────────

interface NotificationState {
  items:       Notification[];
  grouped:     Record<NotificationGroup, Notification[]>;
  unreadCount: number;
  total:       number;
  hasMore:     boolean;
  loading:     boolean;
  error:       string | null;
}

const initialState: NotificationState = {
  items:       [],
  grouped:     {} as Record<NotificationGroup, Notification[]>,
  unreadCount: 0,
  total:       0,
  hasMore:     false,
  loading:     false,
  error:       null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    /** Called by socket handler when a new notification arrives */
    addNotification(state, action: PayloadAction<Notification>) {
      // Prepend and de-duplicate
      const exists = state.items.some((n) => n.id === action.payload.id);
      if (!exists) {
        state.items.unshift(action.payload);
        state.total += 1;
        if (!action.payload.read_at) state.unreadCount += 1;
      }
    },

    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload;
    },

    markAsRead(state, action: PayloadAction<string>) {
      const n = state.items.find((item) => item.id === action.payload);
      if (n && !n.read_at) {
        n.read_at = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    markAllAsRead(state, action: PayloadAction<string | undefined>) {
      const group = action.payload;
      state.items.forEach((n) => {
        if (!n.read_at && (!group || n.group === group)) {
          n.read_at = new Date().toISOString();
        }
      });
      if (!group) {
        state.unreadCount = 0;
      } else {
        state.unreadCount = state.items.filter((n) => !n.read_at).length;
      }
    },

    removeNotification(state, action: PayloadAction<string>) {
      const idx = state.items.findIndex((n) => n.id === action.payload);
      if (idx !== -1) {
        const [removed] = state.items.splice(idx, 1);
        state.total -= 1;
        if (!removed.read_at) state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    clearAll(state) {
      Object.assign(state, initialState);
    },
  },

  extraReducers(builder) {
    builder
      .addCase(fetchNotifications.pending,  (s) => { s.loading = true; s.error = null; })
      .addCase(fetchNotifications.fulfilled, (s, a) => {
        s.loading = false;
        s.items   = a.payload.notifications;
        s.total   = a.payload.total;
        s.hasMore = a.payload.hasMore;
      })
      .addCase(fetchNotifications.rejected, (s, a) => {
        s.loading = false;
        s.error   = a.error.message ?? 'Failed to load notifications';
      })
      .addCase(fetchGrouped.fulfilled, (s, a) => { s.grouped = a.payload.groups; })
      .addCase(fetchUnreadCount.fulfilled, (s, a) => { s.unreadCount = a.payload.count; });
  },
});

export const {
  addNotification,
  setUnreadCount,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearAll,
} = notificationSlice.actions;

export default notificationSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectNotifications  = (s: any) => s.notifications.items;
export const selectUnreadCount    = (s: any) => s.notifications.unreadCount;
export const selectGrouped        = (s: any) => s.notifications.grouped;
export const selectNotifLoading   = (s: any) => s.notifications.loading;