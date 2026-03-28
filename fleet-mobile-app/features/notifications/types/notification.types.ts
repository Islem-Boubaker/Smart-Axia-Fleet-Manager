// ─── Enums (mirror backend constants) ────────────────────────────────────────

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export type NotificationGroup =
  | 'trip'
  | 'maintenance'
  | 'ai'
  | 'driver'
  | 'system';

export type NotificationType =
  | 'trip_assigned'   | 'trip_started'    | 'trip_completed'
  | 'trip_cancelled'  | 'trip_delayed'
  | 'maintenance_overdue' | 'maintenance_scheduled' | 'maintenance_completed'
  | 'vehicle_breakdown'   | 'vehicle_idle'
  | 'ai_anomaly_detected' | 'ai_fuel_anomaly' | 'ai_route_deviation'
  | 'ai_speed_violation'  | 'ai_predictive_alert'
  | 'driver_assigned' | 'driver_unassigned' | 'driver_license_expiry'
  | 'driver_behavior_alert'
  | 'system_alert'    | 'system_update';

// ─── Core model ───────────────────────────────────────────────────────────────

export interface Notification {
  id:          string;
  user_id:     string;
  type:        NotificationType;
  group:       NotificationGroup;
  priority:    NotificationPriority;
  title:       string;
  message:     string;
  entity_type: string | null;
  entity_id:   string | null;
  metadata:    Record<string, any>;
  read_at:     string | null;
  is_archived: boolean;
  push_sent:   boolean;
  created_at:  string;
  updated_at:  string;
}

// ─── API filter params ────────────────────────────────────────────────────────

export interface NotificationFilters {
  page?:     number;
  limit?:    number;
  group?:    NotificationGroup;
  priority?: NotificationPriority;
  type?:     NotificationType;
  unread?:   boolean | string;
  archived?: boolean | string;
  since?:    string;  // ISO date string
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export interface NotificationGroupConfig {
  label:     string;
  icon:      string;
  color:     string;
  bgColor:   string;
}

export const GROUP_CONFIG: Record<NotificationGroup, NotificationGroupConfig> = {
  trip:        { label: 'Trips',       icon: '🚗', color: '#3B82F6', bgColor: '#EFF6FF' },
  maintenance: { label: 'Maintenance', icon: '🔧', color: '#F59E0B', bgColor: '#FFFBEB' },
  ai:          { label: 'AI Alerts',   icon: '🤖', color: '#8B5CF6', bgColor: '#F5F3FF' },
  driver:      { label: 'Driver',      icon: '👤', color: '#10B981', bgColor: '#ECFDF5' },
  system:      { label: 'System',      icon: '⚙️', color: '#6B7280', bgColor: '#F9FAFB' },
};

export const PRIORITY_CONFIG: Record<NotificationPriority, { color: string; label: string }> = {
  low:      { color: '#6B7280', label: 'Low' },
  medium:   { color: '#3B82F6', label: 'Medium' },
  high:     { color: '#F59E0B', label: 'High' },
  critical: { color: '#EF4444', label: 'Critical' },
};