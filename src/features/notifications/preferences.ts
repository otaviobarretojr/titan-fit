export type NotificationPreferences = {
  version: 2;
  enabled: boolean;
  workout: boolean;
  cardio: boolean;
  workoutLeadMinutes: number;
  cardioLeadMinutes: number;
};

const STORAGE_KEY = 'titan-fit:notification-preferences:v1';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  version: 2,
  enabled: false,
  workout: true,
  cardio: true,
  workoutLeadMinutes: 30,
  cardioLeadMinutes: 30,
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
      cardio: parsed.cardio !== false,
      workoutLeadMinutes: clampMinutes(parsed.workoutLeadMinutes, DEFAULT_NOTIFICATION_PREFERENCES.workoutLeadMinutes),
      cardioLeadMinutes: clampMinutes(parsed.cardioLeadMinutes, DEFAULT_NOTIFICATION_PREFERENCES.cardioLeadMinutes),
      version: 2,
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
