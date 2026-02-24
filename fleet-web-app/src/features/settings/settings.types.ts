import type { IconType } from 'react-icons';

export interface ProfileData {
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
}

export interface NotificationPreferences {
  emailTrips: boolean;
  emailMaintenance: boolean;
  emailDrivers: boolean;
  pushTrips: boolean;
  pushMaintenance: boolean;
  pushAlerts: boolean;
  smsAlerts: boolean;
}

export interface GeneralPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  distanceUnit: string;
  currency: string;
}

export interface SettingsTab {
  id: string;
  label: string;
  icon: IconType;
}

export interface SelectOption {
  value: string;
  label: string;
}
