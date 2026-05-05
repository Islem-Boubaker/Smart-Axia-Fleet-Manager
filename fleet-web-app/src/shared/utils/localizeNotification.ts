import type { TFunction } from 'i18next';

interface LocalizableNotification {
  type?: string | null;
  title?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
}

const translateOr = (
  t: TFunction,
  key: string,
  fallback: string,
  options?: Record<string, unknown>
) => {
  const translated = t(key, options);
  return translated === key ? fallback : translated;
};

const vehicleDisplayName = (metadata?: Record<string, unknown> | null, fallbackLabel = 'Vehicle') => {
  const vehicleName = String(metadata?.vehicleName || metadata?.name || '').trim();
  const vehiclePlate = String(metadata?.vehiclePlate || metadata?.plate || '').trim();

  if (vehicleName && vehiclePlate) return `${vehicleName} - ${vehiclePlate}`;
  if (vehicleName) return vehicleName;
  if (vehiclePlate) return vehiclePlate;
  return fallbackLabel;
};

const formatDate = (value: unknown, locale: string, fallback: string) => {
  if (!value) return fallback;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleDateString(locale);
};

const dueText = (t: TFunction, daysUntilDue: number | null) => {
  if (daysUntilDue === null) return '';
  if (daysUntilDue < 0) {
    return translateOr(t, 'dashboard.alerts.daysOverdue', `${Math.abs(daysUntilDue)} day(s) overdue`, {
      count: Math.abs(daysUntilDue),
    });
  }

  return translateOr(t, 'dashboard.alerts.dueInDays', `due in ${daysUntilDue} day(s)`, {
    count: daysUntilDue,
  });
};

export function localizeNotificationText<T extends LocalizableNotification>(
  notification: T,
  t: TFunction,
  locale: string
): { title: string; message: string } {
  const rawTitle = String(notification.title || '').trim();
  const rawMessage = String(notification.message || '').trim();
  const type = String(notification.type || '').trim();
  const metadata = notification.metadata || {};
  const fallbackVehicleLabel = translateOr(t, 'common.vehicle', 'Vehicle');
  const vehicle = vehicleDisplayName(metadata, fallbackVehicleLabel);
  const date = formatDate(metadata?.expiresAt, locale, translateOr(t, 'common.unknown', 'Unknown'));
  const days = typeof metadata?.daysUntilDue === 'number' ? metadata.daysUntilDue : Number.isFinite(Number(metadata?.daysUntilDue)) ? Number(metadata?.daysUntilDue) : null;
  const whenText = dueText(t, days);

  if (type === 'vehicle_tech_visit_expiry') {
    const overdue = days !== null ? days < 0 : /overdue/i.test(rawTitle);
    return {
      title: overdue
        ? translateOr(t, 'dashboard.alerts.techVisitOverdueTitle', `Tech visit overdue - ${vehicle}`, { vehicle })
        : translateOr(t, 'dashboard.alerts.techVisitDueSoonTitle', `Tech visit due soon - ${vehicle}`, { vehicle }),
      message: translateOr(
        t,
        'dashboard.alerts.techVisitMessage',
        `${vehicle} technical visit expires on ${date}${whenText ? ` (${whenText})` : ''}.`,
        { vehicle, date, whenText }
      ),
    };
  }

  if (type === 'vehicle_insurance_expiry') {
    const overdue = days !== null ? days < 0 : /overdue/i.test(rawTitle);
    return {
      title: overdue
        ? translateOr(t, 'dashboard.alerts.insuranceOverdueTitle', `Insurance overdue - ${vehicle}`, { vehicle })
        : translateOr(t, 'dashboard.alerts.insuranceDueSoonTitle', `Insurance due soon - ${vehicle}`, { vehicle }),
      message: translateOr(
        t,
        'dashboard.alerts.insuranceMessage',
        `${vehicle} insurance expires on ${date}${whenText ? ` (${whenText})` : ''}.`,
        { vehicle, date, whenText }
      ),
    };
  }

  return {
    title: rawTitle,
    message: rawMessage,
  };
}

