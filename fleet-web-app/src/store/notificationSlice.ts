import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import notificationApi from "../features/notifications/services/notification.api";
import type { NotificationRecord, NotificationFilters } from "../features/notifications/services/notification.api";

interface NotificationState {
  items: NotificationRecord[];
  unreadCount: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  total: 0,
  hasMore: false,
  loading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (filters: NotificationFilters = {}) => notificationApi.getAll(filters)
);

export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async () => notificationApi.getUnreadCount()
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification(state, action) {
      const exists = state.items.some((item) => item.id === action.payload.id);
      if (!exists) {
        state.items.unshift(action.payload);
        state.total += 1;
        if (!action.payload.read && !action.payload.readAt) {
          state.unreadCount += 1;
        }
      }
    },
    setUnreadCount(state, action) {
      state.unreadCount = action.payload;
    },
    markAsRead(state, action) {
      const notification = state.items.find((item) => item.id === action.payload);
      if (notification && !notification.read && !notification.readAt) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead(state, action) {
      const group = action.payload as string | undefined;
      for (const item of state.items) {
        const shouldMark = !group || item.group === group;
        if (shouldMark && !item.read && !item.readAt) {
          item.read = true;
          item.readAt = new Date().toISOString();
        }
      }
      state.unreadCount = state.items.filter((item) => !item.read && !item.readAt).length;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.notifications ?? [];
        state.total = action.payload.total ?? state.items.length;
        state.hasMore = action.payload.hasMore ?? false;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch notifications";
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.count ?? 0;
      });
  },
});

export const { addNotification, setUnreadCount, markAsRead, markAllAsRead } = notificationSlice.actions;

export default notificationSlice.reducer;
