import { describe, expect, it } from 'vitest';
import { buildSmartReminders, currentSmartAlerts } from '../src/features/notifications/engine';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../src/features/notifications/preferences';
import type { TitanPlan } from '../src/features/plan/types';

const now = new Date(2026, 7, 10, 10, 0, 0);
const preferences = { ...DEFAULT_NOTIFICATION_PREFERENCES, enabled: true };
const plan: TitanPlan = {
  schemaVersion: 1, id: 'plan', name: 'Plano', createdAt: '2026-08-01T00:00:00',
  project: { name: 'Projeto', objective: 'Teste', strengthStartTime: '19:00', cardioSchedule: [{ id: 'cardio-mon', day: 'Segunda-feira', startTime: '20:00', title: 'Zona 2', type: 'zone2', durationMinutes: 30 }] },
  workouts: [{ id: 'workout-mon', day: 'Segunda-feira', title: 'Upper', exercises: [{ id: 'bench', name: 'Supino', muscleGroup: 'Peito' }] }],
};

describe('Notificações inteligentes', () => {
  it('usa horários reais de musculação e cardio', () => {
    const reminders = buildSmartReminders({ plan, workoutHistory: [], preferences }, now, 1);
    const workout = reminders.find((item) => item.kind === 'workout');
    const cardio = reminders.find((item) => item.kind === 'cardio');
    expect(workout?.at.getHours()).toBe(18);
    expect(workout?.at.getMinutes()).toBe(30);
    expect(cardio?.at.getHours()).toBe(19);
    expect(cardio?.at.getMinutes()).toBe(30);
  });

  it('não gera alertas internos obsoletos', () => {
    expect(currentSmartAlerts({ plan, workoutHistory: [], preferences }, now)).toEqual([]);
  });

  it('não agenda nada quando os lembretes estão desativados', () => {
    const reminders = buildSmartReminders({ plan, workoutHistory: [], preferences: { ...preferences, enabled: false } }, now, 7);
    expect(reminders).toEqual([]);
  });
});
