export interface HeaderProps {
  dark: boolean;
  setDark: (dark: boolean) => void;
}

export interface Notification {
  id: string;
  type: 'maintenance' | 'driver' | 'vehicle' | 'warning' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}