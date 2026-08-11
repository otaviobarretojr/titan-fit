export type NotificationPreferences = {
  version: 3;
  enabled: boolean;
  workout: boolean;
  workoutLeadMinutes: number;
};

const STORAGE_KEY = 'titan-fit:notification-preferences:v1';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  version: 3,
  enabled: false,
  workout: true,
  workoutLeadMinutes: 30,
};

export function loadNotificationPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      enabled: Boolean(parsed.enabled),
      workout: parsed.workout !== false,
      workoutLeadMinutes: clampMinutes(parsed.workoutLeadMinutes, DEFAULT_NOTIFICATION_PREFERENCES.workoutLeadMinutes),
      version: 3,
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

export function saveNotificationPreferences(preferences: NotificationPreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent('titan:notification-preferences-changed'));
}

function clampMinutes(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(180, Math.round(parsed)));
}
