export type NotificationPreferences = {
  version: 1;
  enabled: boolean;
  nutrition: boolean;
  overdueMeals: boolean;
  workout: boolean;
  cardio: boolean;
  workoutLeadMinutes: number;
  cardioLeadMinutes: number;
  overdueMealMinutes: number;
};

const STORAGE_KEY = 'titan-fit:notification-preferences:v1';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  version: 1,
  enabled: false,
  nutrition: true,
  overdueMeals: true,
  workout: true,
  cardio: true,
  workoutLeadMinutes: 30,
  cardioLeadMinutes: 30,
  overdueMealMinutes: 30,
};

export function loadNotificationPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    if (parsed.version !== 1) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...parsed,
      version: 1,
      workoutLeadMinutes: clampMinutes(parsed.workoutLeadMinutes, DEFAULT_NOTIFICATION_PREFERENCES.workoutLeadMinutes),
      cardioLeadMinutes: clampMinutes(parsed.cardioLeadMinutes, DEFAULT_NOTIFICATION_PREFERENCES.cardioLeadMinutes),
      overdueMealMinutes: clampMinutes(parsed.overdueMealMinutes, DEFAULT_NOTIFICATION_PREFERENCES.overdueMealMinutes),
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
