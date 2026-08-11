import type { WorkoutHistoryRecord } from '../history/types';
import type { TitanPlan } from '../plan/types';
import type { NotificationPreferences } from './preferences';

const DAY = 86_400_000;
const WEEKDAYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

export type SmartReminderKind = 'workout';
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

    if (context.preferences.workout && context.plan) {
      const workout = context.plan.workouts.find((item) => normalizeDay(item.day).includes(weekday));
      if (workout?.exercises.length && !wasWorkoutCompleted(context.workoutHistory, workout.id, dateKey)) {
        const startTime = context.plan.project?.strengthStartTime ?? '20:00';
        const at = new Date(dateAtTime(date, startTime).getTime() - context.preferences.workoutLeadMinutes * 60_000);
        if (at.getTime() > now.getTime()) {
          const cardioCount = workout.exercises.filter((exercise) => exercise.exerciseType === 'cardio' || exercise.exerciseType === 'distance').length;
          const body = cardioCount > 0
            ? `${context.preferences.workoutLeadMinutes} min para o treino · cardio integrado à sessão.`
            : workout.focus
              ? `${context.preferences.workoutLeadMinutes} min para o treino · ${workout.focus}`
              : `${context.preferences.workoutLeadMinutes} min para o treino programado.`;
          reminders.push(createReminder(`workout:${dateKey}:${workout.id}`, 'workout', at, `Treino: ${workout.title}`, body));
        }
      }
    }
  }

  return reminders.sort((a, b) => a.at.getTime() - b.at.getTime());
}

export function currentSmartAlerts(_context: SmartReminderContext, _now = new Date()): SmartReminder[] {
  return [];
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

function normalizeDay(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
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
