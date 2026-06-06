export type NotificationType =
  | "trip"
  | "maintenance"
  | "ai"
  | "driver"
  | "system"
  | "alert"
  | "claim";

export interface RawNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  type: string;
  group: string;
  read: boolean;
  readAt: string | null;
  actionUrl?: string | null;
  entityType?: string | null;
  entityId?: string | number | null;
  priority?: string | null;
}

export interface NotificationItem {
  id: string;
  name: string;
  message: string;
  titleKey?: string;
  bodyKey?: string;
  time: string;
  type: NotificationType;
  unread: boolean;
  actionUrl?: string | null;
  entityType?: string | null;
  entityId?: string | number | null;
}

export interface NotificationGroup {
  group: string;
  items: NotificationItem[];
}

export interface NotificationFilters {
  limit?: number;
  page?: number;
  offset?: number;
  group?: string;
  priority?: string;
  type?: string;
  unread?: boolean;
  archived?: boolean;
  since?: string;
}
