import { useEffect, useState } from 'react';
import type { TitanPlan } from '../plan/types';
import { loadWorkoutHistory } from '../history/storage';
import { loadNutritionExecutions } from '../nutrition/execution';
import { loadActiveNutritionPlan } from '../nutrition/storage';
import { buildSmartReminders, currentSmartAlerts, type SmartReminder } from './engine';
import { loadNotificationPreferences } from './preferences';

export function SmartReminderBanner({ plan }: { plan: TitanPlan | null }) {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener('titan:nutrition-changed', refresh);
    window.addEventListener('titan:notification-preferences-changed', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('titan:nutrition-changed', refresh);
      window.removeEventListener('titan:notification-preferences-changed', refresh);
    };
  }, []);

  void revision;
  const preferences = loadNotificationPreferences();
  if (!preferences.enabled) return null;
  const context = {
    plan,
    nutritionPlan: loadActiveNutritionPlan(),
    nutritionExecutions: loadNutritionExecutions(),
    workoutHistory: loadWorkoutHistory(),
    preferences,
  };
  const now = new Date();
  const overdue = currentSmartAlerts(context, now).find((item) => item.kind !== 'meal-overdue');
  const upcoming = buildSmartReminders(context, now, 1).find((item) => item.kind !== 'meal-overdue' && item.at.getTime() - now.getTime() <= 60 * 60_000);
  const reminder = overdue ?? upcoming;
  if (!reminder) return null;

  return <section className={`smart-reminder-banner kind-${reminder.kind}`} aria-label="Lembrete inteligente TITAN">
    <div><span className="eyebrow">LEMBRETE TITAN</span><strong>{reminder.title}</strong><p>{reminder.body}</p></div>
    <span className="smart-reminder-time">{overdue ? 'AGORA' : relativeTime(reminder, now)}</span>
  </section>;
}

function relativeTime(reminder: SmartReminder, now: Date) {
  const minutes = Math.max(1, Math.round((reminder.at.getTime() - now.getTime()) / 60_000));
  if (minutes < 60) return `${minutes} min`;
  return '1 h';
}
