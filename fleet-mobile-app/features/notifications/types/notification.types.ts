export type NotificationType = 'trip' | 'schedule' | 'claim' | 'admin' | 'alert';
 
export interface NotificationItem {
  id: string;
  name: string;
  message: string;
  time: string;
  type: NotificationType;
  unread: boolean;
}
 
export interface NotificationGroup {
  group: string;
  items: NotificationItem[];
}
 