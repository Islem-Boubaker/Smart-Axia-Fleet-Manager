export interface HeaderProps {
  toggleSidebar: () => void;
}

export interface Notification {
  id: string;
  type: 'maintenance' | 'driver' | 'vehicle' | 'warning' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}