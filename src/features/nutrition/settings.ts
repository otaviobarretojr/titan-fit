export type NutritionSettings = {
  calorieTarget: number;
  proteinTarget: number;
  balanceMin: number;
  balanceMax: number;
  hydrationGoalMl: number;
  wakeTime: string;
  sleepTime: string;
  workoutTime: string;
  mealTimes: string[];
  notificationsEnabled: boolean;
  mealNotifications: boolean;
  lateMealNotifications: boolean;
  waterNotifications: boolean;
  preWorkoutNotification: boolean;
  dayCloseNotification: boolean;
  waterReminderMinutes: number;
};

const KEY = 'titan-nutrition:settings:v1';

export const DEFAULT_NUTRITION_SETTINGS: NutritionSettings = {
  calorieTarget: 3000,
  proteinTarget: 195,
  balanceMin: -400,
  balanceMax: -200,
  hydrationGoalMl: 4250,
  wakeTime: '06:00',
  sleepTime: '22:30',
  workoutTime: '20:00',
  mealTimes: ['06:30', '09:30', '12:30', '16:30', '19:00', '21:30'],
  notificationsEnabled: false,
  mealNotifications: true,
  lateMealNotifications: true,
  waterNotifications: true,
  preWorkoutNotification: true,
  dayCloseNotification: true,
  waterReminderMinutes: 120,
};

export function loadNutritionSettings(): NutritionSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_NUTRITION_SETTINGS;
    return { ...DEFAULT_NUTRITION_SETTINGS, ...(JSON.parse(raw) as Partial<NutritionSettings>) };
  } catch {
    return DEFAULT_NUTRITION_SETTINGS;
  }
}

export function saveNutritionSettings(next: NutritionSettings) {
  const normalized: NutritionSettings = {
    ...next,
    calorieTarget: Math.max(1200, Math.round(next.calorieTarget)),
    proteinTarget: Math.max(40, Math.round(next.proteinTarget)),
    balanceMin: Math.min(next.balanceMin, next.balanceMax),
    balanceMax: Math.max(next.balanceMin, next.balanceMax),
    hydrationGoalMl: Math.max(1500, Math.round(next.hydrationGoalMl / 50) * 50),
    waterReminderMinutes: Math.max(60, Math.round(next.waterReminderMinutes / 30) * 30),
  };
  localStorage.setItem(KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('titan-nutrition-settings-updated'));
  return normalized;
}

export function balanceTargetCenter(settings = loadNutritionSettings()) {
  return Math.round((settings.balanceMin + settings.balanceMax) / 2);
}
