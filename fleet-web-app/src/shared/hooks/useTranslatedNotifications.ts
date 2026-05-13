import { useTranslatedData } from './useTranslatedData';
import { useNotifications, useGroupedNotifications } from './useNotifications';
import type { NotificationRecord } from '../services/notification.api';
import type { NotificationFilters } from '../services/notification.api';

// The two known notification types are already handled by localizeNotification.ts
// using static i18n keys (vehicle_tech_visit_expiry, vehicle_insurance_expiry).
// We translate title + message for ALL notifications so that:
//   - Known types: localizeNotification ignores raw title/message and uses i18n keys anyway.
//   - Unknown types: localizeNotification returns rawTitle/rawMessage — these will be
//     the Azure-translated versions, giving correct output for free-text notifications.
const NOTIFICATION_FIELDS: (keyof NotificationRecord)[] = ['title', 'message'];

/**
 * Drop-in replacement for useNotifications that automatically translates
 * `title` and `message` fields to the active UI language.
 *
 * Works seamlessly with localizeNotification.ts:
 *  - Template-based notifications (insurance, tech visit) continue to use
 *    static i18n keys and are unaffected.
 *  - Free-text notifications from the backend are Azure-translated.
 */
export const useTranslatedNotifications = (filters: NotificationFilters = {}) => {
  const query = useNotifications(filters);

  const rawData: NotificationRecord[] = Array.isArray(query.data)
    ? (query.data as NotificationRecord[])
    : [];

  const { translatedData, isTranslating } = useTranslatedData<NotificationRecord>(
    rawData,
    NOTIFICATION_FIELDS,
  );

  return {
    ...query,
    data: query.data !== undefined ? translatedData : query.data,
    isTranslating,
  };
};

/**
 * Same as useGroupedNotifications but with translated title/message fields.
 * Returns `Record<string, NotificationRecord[]>` keyed by notification group.
 */
export const useTranslatedGroupedNotifications = (filters: NotificationFilters = {}) => {
  const grouped = useGroupedNotifications(filters);

  // Flatten → translate → re-group
  const allNotifications: NotificationRecord[] = grouped.data
    ? Object.values(grouped.data).flat()
    : [];

  const { translatedData, isTranslating } = useTranslatedData<NotificationRecord>(
    allNotifications,
    NOTIFICATION_FIELDS,
  );

  // Re-group translated items using the same group key
  const translatedGrouped = translatedData.reduce<Record<string, NotificationRecord[]>>(
    (acc, item) => {
      const group = item.group || 'other';
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    },
    {},
  );

  return {
    ...grouped,
    data: grouped.data !== undefined ? translatedGrouped : grouped.data,
    isTranslating,
  };
};
