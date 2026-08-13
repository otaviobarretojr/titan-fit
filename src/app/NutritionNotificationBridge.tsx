import { useEffect } from 'react';
import { syncNutritionNotifications } from '../features/nutrition/notifications';
import { loadNutritionSettings } from '../features/nutrition/settings';
import { loadDailyMeals } from '../features/nutrition/storage';

export function NutritionNotificationBridge() {
  useEffect(() => {
    let timer: number | null = null;
    const sync = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const settings = loadNutritionSettings();
        if (!settings.notificationsEnabled) return;
        void loadDailyMeals().then((meals) => syncNutritionNotifications(settings, meals));
      }, 250);
    };
    window.addEventListener('titan-nutrition-meals-changed', sync);
    window.addEventListener('titan-nutrition-settings-updated', sync);
    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener('titan-nutrition-meals-changed', sync);
      window.removeEventListener('titan-nutrition-settings-updated', sync);
    };
  }, []);
  return null;
}
