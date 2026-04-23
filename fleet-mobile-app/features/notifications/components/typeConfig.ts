import type { NotificationType } from '../types/notification.types';

export interface TypeConfig {
  emoji: string;
  bgClass: string;   // NativeWind background
}

export const TYPE_CONFIG: Record<NotificationType, TypeConfig> = {
  trip:     { emoji: '🚌', bgClass: 'bg-emerald-50'  },
  schedule: { emoji: '📅', bgClass: 'bg-purple-50'   },
  claim:    { emoji: '⚠️',  bgClass: 'bg-orange-50'   },
  admin:    { emoji: '📢', bgClass: 'bg-blue-50'     },
  alert:    { emoji: '🔧', bgClass: 'bg-red-50'      },
};