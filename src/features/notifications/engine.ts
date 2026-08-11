import { getCardioWeekSchedule, normalizeDay } from '../cardio/currentCardio';
import type { WorkoutHistoryRecord } from '../history/types';
import type { NutritionMealExecution } from '../nutrition/execution';
import type { TitanNutritionPlan } from '../nutrition/types';
import type { TitanPlan } from '../plan/types';
import type { NotificationPreferences } from './preferences';

const DAY = 86_400_000;
const WEEKDAYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

export type SmartReminderKind = 'meal' | 'meal-overdue' | 'workout' | 'cardio';
export type SmartReminder = {
  id: number;
  key: string;
  kind: SmartReminderKind;
  at: Date;
  title: string;
  body: string;
};

export type SmartReminderContext = {
  plan: TitanPlan | null;
  nutritionPlan: TitanNutritionPlan | null;
  nutritionExecutions: NutritionMealExecution[];
  workoutHistory: WorkoutHistoryRecord[];
  preferences: NotificationPreferences;
};

export function buildSmartReminders(context: SmartReminderContext, now = new Date(), horizonDays = 7): SmartReminder[] {
  if (!context.preferences.enabled) return [];
  const reminders: SmartReminder[] = [];
  const start = startOfDay(now);

  for (let offset = 0; offset < horizonDays; offset += 1) {
    const date = new Date(start.getTime() + offset * DAY);
    const dateKey = localDateKey(date);
    const weekday = WEEKDAYS[date.getDay()];

    if (context.preferences.nutrition && context.nutritionPlan) {
      const day = context.nutritionPlan.days.find((item) => normalizeDay(item.day).includes(weekday));
      const completed = new Set(context.nutritionExecutions.filter((item) => item.date === dateKey).map((item) => item.mealId));
      for (const meal of day?.meals ?? []) {
        if (completed.has(meal.id)) continue;
        const mealAt = dateAtTime(date, meal.plannedTime);
        if (mealAt.getTime() > now.getTime()) {
          reminders.push(createReminder(`meal:${dateKey}:${meal.id}`, 'meal', mealAt, meal.name, `Horário planejado: ${meal.plannedTime}. Registre sua refeição no TITAN FIT.`));
        }
        if (context.preferences.overdueMeals) {
          const overdueAt = new Date(mealAt.getTime() + context.preferences.overdueMealMinutes * 60_000);
          if (overdueAt.getTime() > now.getTime()) {
            reminders.push(createReminder(`meal-overdue:${dateKey}:${meal.id}`, 'meal-overdue', overdueAt, `${meal.name} pendente`, 'A refeição ainda não foi registrada. Confirme se consumiu, substituiu, pulou ou ajuste o registro.'));
          }
        }
      }
    }

    if (context.preferences.workout && context.plan) {
      const workout = context.plan.workouts.find((item) => normalizeDay(item.day).includes(weekday));
      if (workout?.exercises.length && !wasWorkoutCompleted(context.workoutHistory, workout.id, dateKey)) {
        const startTime = context.plan.project?.strengthStartTime ?? '20:00';
        const at = new Date(dateAtTime(date, startTime).getTime() - context.preferences.workoutLeadMinutes * 60_000);
        if (at.getTime() > now.getTime()) reminders.push(createReminder(`workout:${dateKey}:${workout.id}`, 'workout', at, `Treino: ${workout.title}`, workout.focus ? `${context.preferences.workoutLeadMinutes} min para o treino · ${workout.focus}` : `${context.preferences.workoutLeadMinutes} min para o treino programado.`));
      }
    }

    if (context.preferences.cardio && context.plan) {
      const cardio = getCardioWeekSchedule(context.plan, date).find((item) => normalizeDay(item.day).includes(weekday));
      if (cardio && !wasWorkoutCompleted(context.workoutHistory, cardio.id, dateKey)) {
        const at = new Date(dateAtTime(date, cardio.startTime).getTime() - context.preferences.cardioLeadMinutes * 60_000);
        if (at.getTime() > now.getTime()) reminders.push(createReminder(`cardio:${dateKey}:${cardio.id}`, 'cardio', at, `Cardio: ${cardio.title}`, `${context.preferences.cardioLeadMinutes} min para a sessão · previsto ${cardio.durationMinutes} min.`));
      }
    }
  }

  return reminders.sort((a, b) => a.at.getTime() - b.at.getTime());
}

export function currentSmartAlerts(context: SmartReminderContext, now = new Date()) {
  const alerts: SmartReminder[] = [];
  if (!context.preferences.enabled) return alerts;
  const dateKey = localDateKey(now);
  const weekday = WEEKDAYS[now.getDay()];

  if (context.preferences.nutrition && context.nutritionPlan) {
    const day = context.nutritionPlan.days.find((item) => normalizeDay(item.day).includes(weekday));
    const completed = new Set(context.nutritionExecutions.filter((item) => item.date === dateKey).map((item) => item.mealId));
    for (const meal of day?.meals ?? []) {
      if (completed.has(meal.id)) continue;
      const overdueAt = new Date(dateAtTime(now, meal.plannedTime).getTime() + context.preferences.overdueMealMinutes * 60_000);
      if (overdueAt.getTime() <= now.getTime()) alerts.push(createReminder(`current-overdue:${dateKey}:${meal.id}`, 'meal-overdue', now, `${meal.name} pendente`, `Planejada para ${meal.plannedTime}. Registre o que aconteceu com essa refeição.`));
    }
  }
  return alerts.sort((a, b) => a.title.localeCompare(b.title));
}

function wasWorkoutCompleted(records: WorkoutHistoryRecord[], workoutId: string, dateKey: string) {
  return records.some((record) => record.workoutId === workoutId && localDateKey(new Date(record.completedAt)) === dateKey);
}

function createReminder(key: string, kind: SmartReminderKind, at: Date, title: string, body: string): SmartReminder {
  return { id: stableNotificationId(key), key, kind, at, title, body };
}

function stableNotificationId(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  return Math.abs(hash % 2_000_000_000) + 1000;
}

function dateAtTime(date: Date, value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours || 0, minutes || 0, 0, 0);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
